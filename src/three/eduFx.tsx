'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';
import type { Vec3 } from '@/hardware/types';
import { animationClock } from '@/state/animationClock';
import { useHardwareStore } from '@/state/useHardwareStore';

/**
 * Educational FX primitives. All of them sample the shared animation clock,
 * so play/pause/speed/loop/scrub in the control bar drive the 3D layer
 * frame-accurately.
 */

/** Renders children only while the given educational animation is active. */
export function Anim({ id, children }: { id: string; children: React.ReactNode }) {
  const active = useHardwareStore((s) => s.activeAnimationId === id);
  if (!active) return null;
  return <>{children}</>;
}

const dummy = new Object3D();

interface FlowPathProps {
  /** Control points of the path in local space. */
  points: Vec3[];
  count?: number;
  color?: string;
  size?: number;
  /** Path traversals per animation loop. */
  cycles?: number;
  /** Travel direction: 1 forward, -1 reverse. */
  direction?: 1 | -1;
  /** Phase offset 0..1 so parallel paths desynchronize. */
  phase?: number;
}

/** A stream of glowing packets travelling along a curve. */
export function FlowPath({
  points,
  count = 14,
  color = '#4d7cfe',
  size = 0.045,
  cycles = 2,
  direction = 1,
  phase = 0,
}: FlowPathProps) {
  const mesh = useRef<InstancedMesh>(null!);
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, 'catmullrom', 0.2),
    [points],
  );
  const material = useMemo(() => {
    const c = new Color(color);
    const m = new MeshBasicMaterial({
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    m.color.setRGB(c.r * 2.6, c.g * 2.6, c.b * 2.6);
    return m;
  }, [color]);

  useFrame(() => {
    const im = mesh.current;
    if (!im) return;
    const base = animationClock.progress * cycles;
    for (let i = 0; i < count; i++) {
      let t = (base + phase + i / count) % 1;
      if (direction === -1) t = 1 - t;
      const p = curve.getPoint(t);
      // Ease particles in/out at path ends.
      const fade = Math.min(1, Math.min(t, 1 - t) * 8 + 0.08);
      dummy.position.copy(p);
      dummy.scale.setScalar(fade);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false}>
      <sphereGeometry args={[size, 10, 10]} />
    </instancedMesh>
  );
}

interface ActivityGridProps {
  rows: number;
  cols: number;
  cellSize?: number;
  gap?: number;
  height?: number;
  color?: string;
  mode?: 'wave' | 'random' | 'sequence';
  position?: Vec3;
}

/** A grid of cells lighting up — core load, shader waves, pipeline stages. */
export function ActivityGrid({
  rows,
  cols,
  cellSize = 0.16,
  gap = 0.05,
  height = 0.03,
  color = '#4d7cfe',
  mode = 'random',
  position = [0, 0, 0],
}: ActivityGridProps) {
  const mesh = useRef<InstancedMesh>(null!);
  const count = rows * cols;
  const base = useMemo(() => new Color(color), [color]);
  const tmp = useMemo(() => new Color(), []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useFrame(() => {
    const im = mesh.current;
    if (!im) return;
    const t = animationClock.progress;
    const w = cols * (cellSize + gap) - gap;
    const d = rows * (cellSize + gap) - gap;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let intensity: number;
        if (mode === 'wave') {
          intensity = 0.5 + 0.5 * Math.sin((c / cols + r / rows) * Math.PI * 2 - t * Math.PI * 4);
        } else if (mode === 'sequence') {
          const active = Math.floor(t * count * 2) % count;
          intensity = idx === active ? 1 : idx === (active + count - 1) % count ? 0.45 : 0.08;
        } else {
          // Deterministic pseudo-random flicker per cell.
          const seed = Math.sin(idx * 127.1 + 311.7) * 43758.5453;
          const rnd = seed - Math.floor(seed);
          intensity = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * (2 + rnd * 3) + rnd * 40);
          intensity = Math.pow(Math.max(intensity, 0), 1.6);
        }
        dummy.position.set(
          position[0] + c * (cellSize + gap) - w / 2 + cellSize / 2,
          position[1],
          position[2] + r * (cellSize + gap) - d / 2 + cellSize / 2,
        );
        dummy.scale.set(1, 0.4 + intensity, 1);
        dummy.updateMatrix();
        im.setMatrixAt(idx, dummy.matrix);
        tmp.copy(base).multiplyScalar(0.25 + intensity * 2.4);
        im.setColorAt(idx, tmp);
        idx++;
      }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false}>
      <boxGeometry args={[cellSize, height, cellSize]} />
    </instancedMesh>
  );
}

interface RisingParticlesProps {
  area?: [number, number];
  height?: number;
  count?: number;
  color?: string;
  size?: number;
  position?: Vec3;
  /** Swirl strength (used for fan airflow). */
  swirl?: number;
  direction?: 1 | -1;
}

/** Particles rising through a column — heat, airflow. */
export function RisingParticles({
  area = [1, 1],
  height = 1.4,
  count = 40,
  color = '#f5a623',
  size = 0.03,
  position = [0, 0, 0],
  swirl = 0,
  direction = 1,
}: RisingParticlesProps) {
  const mesh = useRef<InstancedMesh>(null!);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const s = Math.sin(i * 91.7 + 12.3) * 43758.5453;
        const s2 = Math.sin(i * 53.3 + 91.1) * 24634.6345;
        return {
          x: (s - Math.floor(s)) - 0.5,
          z: (s2 - Math.floor(s2)) - 0.5,
          offset: ((s * 7.13) % 1 + 1) % 1,
          speed: 0.7 + ((s2 * 3.7) % 1 + 1) % 1 * 0.6,
        };
      }),
    [count],
  );
  const material = useMemo(() => {
    const c = new Color(color);
    const m = new MeshBasicMaterial({
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    m.color.setRGB(c.r * 2.2, c.g * 2.2, c.b * 2.2);
    return m;
  }, [color]);

  useFrame(() => {
    const im = mesh.current;
    if (!im) return;
    const t = animationClock.progress * 2;
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      const life = (t * seed.speed + seed.offset) % 1;
      const y = life * height * direction;
      const angle = life * Math.PI * 2 * swirl + i;
      const sw = swirl > 0 ? life * 0.35 : 0;
      dummy.position.set(
        position[0] + seed.x * area[0] + Math.cos(angle) * sw,
        position[1] + y,
        position[2] + seed.z * area[1] + Math.sin(angle) * sw,
      );
      const fade = Math.sin(life * Math.PI);
      dummy.scale.setScalar(Math.max(fade, 0.001));
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false}>
      <sphereGeometry args={[size, 8, 8]} />
    </instancedMesh>
  );
}

interface PulseRingProps {
  radius?: number;
  color?: string;
  position?: Vec3;
  rotation?: Vec3;
  /** Pulses per loop. */
  rate?: number;
}

/** An expanding ring pulse — clock signals, socket activity. */
export function PulseRing({
  radius = 1,
  color = '#2dd4bf',
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  rate = 4,
}: PulseRingProps) {
  const mesh = useRef<Mesh>(null!);
  const material = useMemo(() => {
    const c = new Color(color);
    const m = new MeshBasicMaterial({
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: DoubleSide,
    });
    m.color.setRGB(c.r * 2.4, c.g * 2.4, c.b * 2.4);
    return m;
  }, [color]);

  useFrame(() => {
    if (!mesh.current) return;
    const t = (animationClock.progress * rate) % 1;
    const scale = 0.15 + t * 1.1;
    mesh.current.scale.setScalar(scale * radius);
    material.opacity = (1 - t) * 0.8;
  });

  return (
    <mesh ref={mesh} position={position} rotation={rotation} material={material} frustumCulled={false}>
      <ringGeometry args={[0.86, 1, 48]} />
    </mesh>
  );
}
