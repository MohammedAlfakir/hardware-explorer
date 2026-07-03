'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import type { Line2 } from 'three-stdlib';
import { Group, Vector3 } from 'three';
import type { PartDefinition } from '@/hardware/types';
import { useActiveHardware, useHardwareStore } from '@/state/useHardwareStore';
import { partRegistry } from './partRegistry';
import { explode } from './explodeState';
import { color as tokens, zIndex } from '@/design/tokens';

/**
 * Label Manager — floating annotations that track their hardware component
 * every frame, stay anchored through explode animations, hide behind
 * geometry (raycast occlusion), fade naturally and draw a live connector
 * line back to the part.
 */
export function LabelLayer() {
  const hardware = useActiveHardware();
  const labelsVisible = useHardwareStore((s) => s.labelsVisible);
  const transitioning = useHardwareStore((s) => s.modelTransitioning);

  if (!labelsVisible || transitioning) return null;

  return (
    <group>
      {hardware.parts.map((part, i) => (
        <PartLabel key={part.id} part={part} index={i + 1} />
      ))}
    </group>
  );
}

const anchorWorld = new Vector3();

function PartLabel({ part, index }: { part: PartDefinition; index: number }) {
  const holder = useRef<Group>(null!);
  const line = useRef<Line2>(null!);
  const [occluded, setOccluded] = useState(false);
  const [active, setActive] = useState(false);

  const isSelected = useHardwareStore((s) => s.selectedPartIds.includes(part.id));
  const shown = useHardwareStore((s) => {
    if (s.hiddenPartIds.includes(part.id)) return false;
    if (s.isolatedPartIds.length > 0 && !s.isolatedPartIds.includes(part.id)) return false;
    if (part.internal && !s.exploded && !s.xray && !s.selectedPartIds.includes(part.id)) return false;
    return true;
  });

  useFrame(() => {
    const entry = partRegistry.get(part.id);
    if (!entry || !holder.current) return;
    entry.anchor.getWorldPosition(anchorWorld);
    const spread = 1 + explode.value * 0.35;
    holder.current.position.set(
      anchorWorld.x + part.labelOffset[0] * spread,
      anchorWorld.y + part.labelOffset[1] * spread,
      anchorWorld.z + part.labelOffset[2] * spread,
    );
    holder.current.visible = shown;
    if (line.current) {
      line.current.visible = shown && !occluded;
      const p = holder.current.position;
      line.current.geometry.setPositions([
        anchorWorld.x, anchorWorld.y, anchorWorld.z,
        p.x, p.y, p.z,
      ]);
    }
  });

  return (
    <>
      <Line
        ref={line}
        points={[
          [0, 0, 0],
          [0, 0.001, 0],
        ]}
        color={isSelected ? tokens.accentBright : tokens.labelLine}
        lineWidth={1}
        transparent
        opacity={isSelected ? 0.9 : 0.4}
      />
      <group ref={holder}>
        <Html
          center
          occlude
          onOcclude={(v) => {
            setOccluded(v);
            return null;
          }}
          zIndexRange={[zIndex.labels, zIndex.labels]}
          style={{
            transition: 'opacity 0.25s cubic-bezier(0.22,1,0.36,1), transform 0.25s cubic-bezier(0.22,1,0.36,1)',
            opacity: occluded || !shown ? 0 : 1,
            transform: occluded || !shown ? 'scale(0.92)' : 'scale(1)',
            pointerEvents: occluded || !shown ? 'none' : 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => useHardwareStore.getState().selectPart(part.id)}
            onMouseEnter={() => {
              setActive(true);
              useHardwareStore.getState().setHoveredPart(part.id);
            }}
            onMouseLeave={() => {
              setActive(false);
              useHardwareStore.getState().setHoveredPart(null);
            }}
            aria-label={`Select ${part.name}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              padding: '4px 9px 4px 5px',
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 550,
              letterSpacing: '0.01em',
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              color: isSelected ? '#fff' : tokens.textPrimary,
              background: isSelected ? 'rgba(246,130,31,0.94)' : tokens.surfaceGlass,
              border: `1px solid ${isSelected ? tokens.accent : active ? tokens.borderStrong : tokens.border}`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 4px 14px rgba(25,25,25,0.14)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.2s',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: 5,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'var(--font-geist-mono), monospace',
                color: isSelected ? tokens.accent : tokens.accentBright,
                background: isSelected ? '#fff' : 'rgba(246,130,31,0.14)',
              }}
            >
              {index}
            </span>
            {part.name}
          </button>
        </Html>
      </group>
    </>
  );
}
