'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, InstancedMesh, Object3D } from 'three';
import type { HardwareId, MaterialKey, PartDefinition, Vec3 } from '@/hardware/types';
import { HARDWARE } from '@/hardware/registry';
import { getBaseMaterial } from '@/three/materials';
import { useHardwareStore } from '@/state/useHardwareStore';
import { animationClock } from '@/state/animationClock';

/** Resolve a part definition; throws in dev if geometry and data drift. */
export function defOf(hardwareId: HardwareId, partId: string): PartDefinition {
  const def = HARDWARE[hardwareId].parts.find((p) => p.id === partId);
  if (!def) throw new Error(`Unknown part "${partId}" on ${hardwareId}`);
  return def;
}

/** Current-variant material getter for model authors. */
export function useMat() {
  const variant = useHardwareStore((s) => s.materialVariant);
  return useMemo(
    () => (key: MaterialKey) => getBaseMaterial(key, variant),
    [variant],
  );
}

export interface InstanceTransform {
  position: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
}

interface InstancedPartProps {
  transforms: InstanceTransform[];
  material: import('three').Material;
  children: React.ReactNode; // a single geometry element
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Static instanced geometry (pins, pads, fins, capacitors, …). */
export function Instanced({ transforms, material, children, castShadow = true, receiveShadow = true }: InstancedPartProps) {
  const ref = useRef<InstancedMesh>(null!);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    transforms.forEach((t, i) => {
      dummy.position.set(...t.position);
      dummy.rotation.set(...(t.rotation ?? [0, 0, 0]));
      dummy.scale.set(...(t.scale ?? [1, 1, 1]));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [transforms]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, material, transforms.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {children}
    </instancedMesh>
  );
}

/** Grid layout helper for instanced parts. */
export function gridTransforms(
  cols: number,
  rows: number,
  stepX: number,
  stepZ: number,
  y: number,
  base: Vec3 = [0, 0, 0],
): InstanceTransform[] {
  const out: InstanceTransform[] = [];
  const ox = -((cols - 1) * stepX) / 2;
  const oz = -((rows - 1) * stepZ) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        position: [base[0] + ox + c * stepX, base[1] + y, base[2] + oz + r * stepZ],
      });
    }
  }
  return out;
}

interface SpinProps {
  axis?: 'x' | 'y' | 'z';
  /** Base speed in rad/s (scaled by the animation clock speed & play state). */
  speed?: number;
  /** Optional dynamic speed multiplier sampled every frame. */
  modulate?: () => number;
  children: React.ReactNode;
}

/** Continuous rotation (fan rotors) respecting pause and playback speed. */
export function Spin({ axis = 'z', speed = 9, modulate, children }: SpinProps) {
  const ref = useRef<Group>(null!);
  useFrame((_, delta) => {
    if (!ref.current || !animationClock.playing) return;
    const mult = (modulate?.() ?? 1) * animationClock.speed;
    ref.current.rotation[axis] += delta * speed * mult;
  });
  return <group ref={ref}>{children}</group>;
}

/** Smoothstep used by PWM-style speed curves. */
export function smoothstep(t: number) {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}
