'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  Box3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { BufferGeometry } from 'three';
import type { PartDefinition, Vec3 } from '@/hardware/types';
import { useHardwareStore } from '@/state/useHardwareStore';
import { explode } from './explodeState';
import { clonePartMaterial } from './materials';
import { partRegistry } from './partRegistry';
import { color as tokens } from '@/design/tokens';

/* Accelerated raycasting (MeshBVH) for precise, fast picking. */
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

const SELECT_EMISSIVE = new Color(tokens.selectionEmissive);
const HOVER_EMISSIVE = new Color(tokens.hoverEmissive);

interface PartProps {
  definition: PartDefinition;
  position?: Vec3;
  rotation?: Vec3;
  children: React.ReactNode;
}

interface ManagedMaterial {
  material: MeshStandardMaterial;
  baseEmissive: Color;
  baseEmissiveIntensity: number;
  baseTransparent: boolean;
  baseOpacity: number;
  baseDepthWrite: boolean;
}

/**
 * Part — the interaction wrapper every selectable hardware component lives
 * in. Handles picking, hover, multi-selection, explode offsets, isolation,
 * hiding, x-ray, wireframe and selection glow. Geometry authors simply nest
 * meshes inside; materials are cloned per part so view modes never bleed.
 */
export function Part({ definition, position = [0, 0, 0], rotation = [0, 0, 0], children }: PartProps) {
  const group = useRef<Group>(null!);
  const anchor = useRef<Object3D>(null!);
  const managed = useRef<ManagedMaterial[]>([]);
  const basePos = useMemo(() => new Vector3(...position), [position]);
  const explodeDir = useMemo(
    () => new Vector3(...definition.explodeDir),
    [definition.explodeDir],
  );

  const isSelected = useHardwareStore((s) => s.selectedPartIds.includes(definition.id));
  const isHovered = useHardwareStore((s) => s.hoveredPartId === definition.id);
  const visible = useHardwareStore((s) => {
    if (s.hiddenPartIds.includes(definition.id)) return false;
    if (s.isolatedPartIds.length > 0 && !s.isolatedPartIds.includes(definition.id)) return false;
    return true;
  });

  /* Clone materials, compute BVH, center the anchor, register. */
  useEffect(() => {
    const g = group.current;
    const seen = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    const list: ManagedMaterial[] = [];

    g.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      const geo = mesh.geometry as BufferGeometry & { boundsTree?: unknown };
      if (!geo.boundsTree && geo.attributes.position?.count > 24) {
        geo.computeBoundsTree();
      }
      const src = mesh.material as MeshStandardMaterial;
      if (!src || !(src as MeshStandardMaterial).isMaterial) return;
      let clone = seen.get(src);
      if (!clone) {
        clone = clonePartMaterial(src);
        seen.set(src, clone);
        list.push({
          material: clone,
          baseEmissive: clone.emissive ? clone.emissive.clone() : new Color(0x000000),
          baseEmissiveIntensity: clone.emissiveIntensity ?? 1,
          baseTransparent: clone.transparent,
          baseOpacity: clone.opacity,
          baseDepthWrite: clone.depthWrite,
        });
      }
      mesh.material = clone;
    });
    managed.current = list;

    const box = new Box3().setFromObject(g);
    const center = box.getCenter(new Vector3());
    anchor.current.position.copy(g.worldToLocal(center.clone()));

    partRegistry.register(definition.id, {
      object: g,
      anchor: anchor.current,
      definition,
    });

    return () => {
      partRegistry.unregister(definition.id);
      list.forEach((m) => m.material.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.id]);

  useFrame((_, delta) => {
    const s = useHardwareStore.getState();
    const g = group.current;
    if (!g) return;

    /* Explode offset */
    const dist = explode.value * definition.explodeDist * (0.4 + s.explodeDistance * 1.2);
    g.position.set(
      basePos.x + explodeDir.x * dist,
      basePos.y + explodeDir.y * dist,
      basePos.z + explodeDir.z * dist,
    );

    /* Material state */
    const lerp = Math.min(delta * 10, 1);
    const xrayGhost = s.xray && !isSelected && !isHovered;
    for (const m of managed.current) {
      const mat = m.material;
      mat.wireframe = s.wireframe;

      const targetOpacity = xrayGhost ? 0.14 : m.baseOpacity;
      mat.opacity += (targetOpacity - mat.opacity) * lerp;
      const ghosting = mat.opacity < m.baseOpacity - 0.02;
      mat.transparent = ghosting || m.baseTransparent;
      mat.depthWrite = ghosting ? false : m.baseDepthWrite;

      if (isSelected) {
        mat.emissive.lerp(SELECT_EMISSIVE, lerp);
        const pulse = 0.42 + Math.sin(performance.now() * 0.004) * 0.1;
        mat.emissiveIntensity += (pulse - mat.emissiveIntensity) * lerp;
      } else if (isHovered) {
        mat.emissive.lerp(HOVER_EMISSIVE, lerp);
        mat.emissiveIntensity += (0.16 - mat.emissiveIntensity) * lerp;
      } else {
        mat.emissive.lerp(m.baseEmissive, lerp);
        mat.emissiveIntensity += (m.baseEmissiveIntensity - mat.emissiveIntensity) * lerp;
      }
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = useHardwareStore.getState();
    if (s.measureMode) {
      s.addMeasurePoint([e.point.x, e.point.y, e.point.z]);
      return;
    }
    s.selectPart(definition.id, e.shiftKey || e.metaKey);
  };

  return (
    <group
      ref={group}
      visible={visible}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        useHardwareStore.getState().setHoveredPart(definition.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        const s = useHardwareStore.getState();
        if (s.hoveredPartId === definition.id) s.setHoveredPart(null);
        document.body.style.cursor = 'auto';
      }}
    >
      <object3D ref={anchor} />
      {children}
    </group>
  );
}
