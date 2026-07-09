'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial, Vector3 } from 'three';
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
  const [occluded, setOccluded] = useState(false);
  const [active, setActive] = useState(false);

  // How long occlusion must hold before we act on it, in seconds. Debouncing
  // the raycast result stops the label from flickering as geometry sweeps past
  // the sight line during rotation.
  const occludeAccum = useRef(0);
  const rawOccluded = useRef(false);

  const isSelected = useHardwareStore((s) => s.selectedPartIds.includes(part.id));

  // A plain two-vertex THREE.Line we mutate in place every frame — a clean 1px
  // screen line that reprojects smoothly, unlike the fat-line (Line2) shader
  // which needs a resolution uniform and wobbles when its endpoints move live.
  // Built imperatively and mounted via <primitive> to sidestep the SVG `<line>`
  // JSX-type collision in .tsx files.
  const line = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    const m = new LineBasicMaterial({ transparent: true });
    return new Line(g, m);
  }, []);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
    };
  }, [line]);

  // Keep the line's color/opacity in sync with selection state.
  const mat = line.material as LineBasicMaterial;
  mat.color.set(isSelected ? tokens.accentBright : tokens.labelLine);
  mat.opacity = isSelected ? 0.9 : 0.4;
  const shown = useHardwareStore((s) => {
    if (s.hiddenPartIds.includes(part.id)) return false;
    if (s.isolatedPartIds.length > 0 && !s.isolatedPartIds.includes(part.id)) return false;
    if (part.internal && !s.exploded && !s.xray && !s.selectedPartIds.includes(part.id)) return false;
    return true;
  });

  useFrame((_, delta) => {
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

    // Debounce occlusion: only commit a change once the raw raycast result has
    // held steady for ~120ms, so momentary flips during rotation don't flicker.
    if (rawOccluded.current !== occluded) {
      occludeAccum.current += delta;
      if (occludeAccum.current >= 0.12) {
        occludeAccum.current = 0;
        setOccluded(rawOccluded.current);
      }
    } else {
      occludeAccum.current = 0;
    }

    line.visible = shown && !occluded;
    const p = holder.current.position;
    const pos = line.geometry.attributes.position;
    pos.setXYZ(0, anchorWorld.x, anchorWorld.y, anchorWorld.z);
    pos.setXYZ(1, p.x, p.y, p.z);
    pos.needsUpdate = true;
  });

  return (
    <>
      <primitive object={line} />
      <group ref={holder}>
        <Html
          center
          occlude
          onOcclude={(v) => {
            rawOccluded.current = v;
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
            onClick={(e) => {
              // Without this the click bubbles to the canvas container and
              // fires R3F's onPointerMissed, which clears the selection the
              // label click just made.
              e.stopPropagation();
              useHardwareStore.getState().selectPart(part.id);
            }}
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
