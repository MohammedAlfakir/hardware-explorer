'use client';

import { Html, Line } from '@react-three/drei';
import { useHardwareStore } from '@/state/useHardwareStore';
import { color as tokens, zIndex } from '@/design/tokens';

/** World units → millimeters (models are built at 1 unit ≈ 10 mm). */
const MM_PER_UNIT = 10;

/**
 * Dimension measurement: with measure mode armed, two clicks on geometry
 * drop markers and read out the physical distance between them.
 */
export function MeasureTool() {
  const measureMode = useHardwareStore((s) => s.measureMode);
  const points = useHardwareStore((s) => s.measurePoints);

  if (!measureMode || points.length === 0) return null;

  const [a, b] = points;
  const distance =
    points.length === 2
      ? Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * MM_PER_UNIT
      : null;
  const mid: [number, number, number] =
    points.length === 2
      ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
      : a;

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={tokens.amber} />
        </mesh>
      ))}
      {points.length === 2 && (
        <>
          <Line points={[a, b]} color={tokens.amber} lineWidth={1.5} dashed dashSize={0.08} gapSize={0.05} />
          <Html center position={mid} zIndexRange={[zIndex.labels, zIndex.labels]}>
            <div
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 650,
                fontFamily: 'var(--font-geist-mono), monospace',
                color: '#0b0d12',
                background: tokens.amber,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {distance!.toFixed(1)} mm
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
