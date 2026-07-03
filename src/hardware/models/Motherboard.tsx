'use client';

import { useMemo } from 'react';
import { Extrude, RoundedBox } from '@react-three/drei';
import { Shape } from 'three';
import { Part } from '@/three/Part';
import { Anim, FlowPath, PulseRing } from '@/three/eduFx';
import type { InstanceTransform } from './common';
import { defOf, gridTransforms, Instanced, useMat } from './common';

const HW = 'motherboard' as const;

/** Socket center in board space (upper-center-left, real ATX placement). */
const SOCKET: [number, number] = [-0.45, -1.45];

/** DIMM slot X positions (world/board space), 4 slots right of the socket. */
const DIMM_X = [0.91, 1.17, 1.43, 1.69] as const;

/** ATX standoff screw-hole positions (3 × 3 pattern like a real board). */
const STANDOFFS: ReadonlyArray<readonly [number, number]> = [
  [-2.35, -2.88], [0.73, -2.88], [2.35, -2.88],
  [-2.35, 0.45], [0.55, 0.45], [2.35, 0.45],
  [-2.35, 2.88], [-0.45, 2.88], [2.35, 2.88],
];

/**
 * Motherboard — ATX platform lying flat in the XZ plane, product-render
 * style: black PCB, brushed silver heatsinks, gold contacts, one orange
 * accent stripe on the I/O shroud. Rear I/O on the left edge (−X), bottom
 * headers at +Z. Bounds [5.2, 1.0, 6.2].
 */
export function MotherboardModel() {
  const mat = useMat();

  /* ---------- PCB standoff rings ---------- */
  const standoffRings = useMemo<InstanceTransform[]>(
    () => STANDOFFS.map(([x, z]) => ({ position: [x, 0.056, z], rotation: [Math.PI / 2, 0, 0] })),
    [],
  );
  const standoffHoles = useMemo<InstanceTransform[]>(
    () => STANDOFFS.map(([x, z]) => ({ position: [x, 0.052, z] })),
    [],
  );

  /* ---------- LGA contact field (14 × 14 = 196 gold dots) ---------- */
  const socketPads = useMemo(() => gridTransforms(14, 14, 0.072, 0.072, 0.09), []);

  /* ---------- VRM fins, chokes, MOSFETs ---------- */
  const finsLeft = useMemo<InstanceTransform[]>(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 11; i++) out.push({ position: [-1.73, 0.36, -2.5 + i * 0.2] });
    return out;
  }, []);
  const finsTop = useMemo<InstanceTransform[]>(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 11; i++) out.push({ position: [-1.45 + i * 0.2, 0.36, -2.7] });
    return out;
  }, []);
  const chokes = useMemo<InstanceTransform[]>(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 7; i++) out.push({ position: [-1.3, 0.08, -2.35 + i * 0.3] });
    for (let i = 0; i < 6; i++) out.push({ position: [-1.0 + i * 0.3, 0.08, -2.31] });
    return out;
  }, []);
  const mosfets = useMemo<InstanceTransform[]>(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 8; i++) out.push({ position: [-1.5, 0.02, -2.3 + i * 0.26] });
    for (let i = 0; i < 8; i++) out.push({ position: [-1.0 + i * 0.22, 0.02, -2.47], rotation: [0, Math.PI / 2, 0] });
    return out;
  }, []);

  /* ---------- Capacitor field (VRM area, right edge, chipset, audio) ---------- */
  const caps = useMemo<InstanceTransform[]>(() => {
    const spots: Array<[number, number]> = [
      // Below the socket
      [-1.0, -0.5], [-0.74, -0.5], [-0.48, -0.5], [-0.22, -0.5], [0.04, -0.5], [0.3, -0.5],
      // Between socket and DIMMs
      [0.5, -2.2], [0.5, -1.9], [0.5, -1.6], [0.5, -1.3], [0.5, -1.0],
      // Right edge near ATX input
      [2.15, -1.85], [2.15, -1.6], [2.15, -1.35],
      // Beside the chipset
      [2.28, 0.85], [2.28, 1.1],
      // Audio circuitry, bottom-left corner
      [-2.25, 2.45], [-2.08, 2.6], [-1.9, 2.45], [-2.08, 2.3], [-1.9, 2.72],
      // Misc rails
      [0.5, -0.4], [-1.9, 0.2], [-2.1, 0.35],
    ];
    return spots.map(([x, z]) => ({ position: [x, 0.08, z] }));
  }, []);
  const capTops = useMemo<InstanceTransform[]>(
    () => caps.map((c) => ({ position: [c.position[0], 0.163, c.position[2]] })),
    [caps],
  );

  /* ---------- 24-pin ATX pin holes (2 × 12) ---------- */
  const atxPins = useMemo(() => gridTransforms(2, 12, 0.13, 0.105, 0.35), []);

  /* ---------- Front-panel / USB header pins ---------- */
  const headerPins = useMemo<InstanceTransform[]>(
    () => [
      ...gridTransforms(5, 2, 0.09, 0.1, 0.115, [-0.5, 0, 0]),
      ...gridTransforms(5, 2, 0.09, 0.1, 0.115, [0.05, 0, 0]),
      ...gridTransforms(7, 2, 0.09, 0.1, 0.115, [1.1, 0, 0]),
    ],
    [],
  );

  /* ---------- I/O shroud profile (angular wedge, extruded along Z) ---------- */
  const shroudShape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(0.5, 0);
    s.lineTo(0.5, 0.14);
    s.lineTo(0.24, 0.4);
    s.lineTo(0, 0.44);
    s.closePath();
    return s;
  }, []);
  const shroudExtrude = useMemo(
    () => ({ depth: 2.8, steps: 1, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }),
    [],
  );

  return (
    <group position={[0, 0.05, 0]}>
      {/* ————— PCB: black 8-layer board with standoff rings ————— */}
      <Part definition={defOf(HW, 'pcb')} position={[0, 0, 0]}>
        <RoundedBox args={[5.0, 0.1, 6.0]} radius={0.05} smoothness={2} castShadow receiveShadow material={mat('pcbBlack')} />
        {/* Standoff screw holes: silver ring + dark bore */}
        <Instanced transforms={standoffRings} material={mat('steel')} castShadow={false}>
          <torusGeometry args={[0.07, 0.016, 6, 20]} />
        </Instanced>
        <Instanced transforms={standoffHoles} material={mat('chipLabel')} castShadow={false}>
          <cylinderGeometry args={[0.045, 0.045, 0.01, 12]} />
        </Instanced>
      </Part>

      {/* ————— CPU socket: raised LGA frame, gold land field, lever ————— */}
      <Part definition={defOf(HW, 'cpu-socket')} position={[SOCKET[0], 0.05, SOCKET[1]]}>
        {/* Base plate + recessed floor */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow material={mat('steel')}>
          <boxGeometry args={[1.46, 0.06, 1.46]} />
        </mesh>
        <mesh position={[0, 0.065, 0]} receiveShadow material={mat('chipLabel')}>
          <boxGeometry args={[1.16, 0.03, 1.16]} />
        </mesh>
        {/* 196 spring-pin contacts */}
        <Instanced transforms={socketPads} material={mat('goldContact')} castShadow={false}>
          <cylinderGeometry args={[0.016, 0.016, 0.012, 6]} />
        </Instanced>
        {/* Retention frame */}
        <mesh position={[-0.66, 0.1, 0]} castShadow material={mat('steel')}>
          <boxGeometry args={[0.14, 0.07, 1.46]} />
        </mesh>
        <mesh position={[0.66, 0.1, 0]} castShadow material={mat('steel')}>
          <boxGeometry args={[0.14, 0.07, 1.46]} />
        </mesh>
        <mesh position={[0, 0.1, -0.66]} castShadow material={mat('steel')}>
          <boxGeometry args={[1.46, 0.07, 0.14]} />
        </mesh>
        <mesh position={[0, 0.1, 0.66]} castShadow material={mat('steel')}>
          <boxGeometry args={[1.46, 0.07, 0.14]} />
        </mesh>
        {/* ILM tongue */}
        <mesh position={[0, 0.1, 0.8]} castShadow material={mat('steel')}>
          <boxGeometry args={[0.4, 0.05, 0.16]} />
        </mesh>
        {/* Retention lever: long arm + bent handle + hook */}
        <mesh position={[0.82, 0.06, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat('steel')}>
          <cylinderGeometry args={[0.022, 0.022, 1.3, 10]} />
        </mesh>
        <mesh position={[0.71, 0.06, -0.62]} rotation={[0, 0, Math.PI / 2]} castShadow material={mat('steel')}>
          <cylinderGeometry args={[0.022, 0.022, 0.24, 10]} />
        </mesh>
        <mesh position={[0.78, 0.08, 0.68]} castShadow material={mat('steel')}>
          <boxGeometry args={[0.1, 0.04, 0.08]} />
        </mesh>
      </Part>

      {/* ————— VRM: finned heatsink banks, choke rows, MOSFET stages ————— */}
      <Part definition={defOf(HW, 'vrm')} position={[0, 0.05, 0]}>
        {/* Left bank (beside the rear I/O) */}
        <RoundedBox args={[0.38, 0.3, 2.3]} radius={0.04} smoothness={2} position={[-1.73, 0.15, -1.5]} castShadow receiveShadow material={mat('brushedAluminum')} />
        <Instanced transforms={finsLeft} material={mat('brushedAluminum')}>
          <boxGeometry args={[0.34, 0.16, 0.1]} />
        </Instanced>
        {/* Top bank (above the socket) */}
        <RoundedBox args={[2.2, 0.3, 0.42]} radius={0.04} smoothness={2} position={[-0.45, 0.15, -2.7]} castShadow receiveShadow material={mat('brushedAluminum')} />
        <Instanced transforms={finsTop} material={mat('brushedAluminum')}>
          <boxGeometry args={[0.1, 0.16, 0.38]} />
        </Instanced>
        {/* Chokes + MOSFET power stages */}
        <Instanced transforms={chokes} material={mat('darkMetal')}>
          <boxGeometry args={[0.22, 0.16, 0.22]} />
        </Instanced>
        <Instanced transforms={mosfets} material={mat('chipLabel')} castShadow={false}>
          <boxGeometry args={[0.08, 0.03, 0.16]} />
        </Instanced>
      </Part>

      {/* ————— DIMM slots: 4 × DDR5, alternating channel colors ————— */}
      <Part definition={defOf(HW, 'dimm-slots')} position={[1.3, 0.05, -1.3]}>
        {DIMM_X.map((wx, i) => {
          const x = wx - 1.3;
          const body = mat(i % 2 ? 'chipSilk' : 'plasticMatte');
          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.065, 0]} castShadow receiveShadow material={body}>
                <boxGeometry args={[0.15, 0.13, 3.0]} />
              </mesh>
              {/* Gold contact line, split by the DDR5 key */}
              <mesh position={[0, 0.132, -0.56]} material={mat('goldContact')}>
                <boxGeometry args={[0.04, 0.006, 1.72]} />
              </mesh>
              <mesh position={[0, 0.132, 0.94]} material={mat('goldContact')}>
                <boxGeometry args={[0.04, 0.006, 0.96]} />
              </mesh>
              {/* Key bump */}
              <mesh position={[0, 0.132, 0.38]} material={body}>
                <boxGeometry args={[0.15, 0.024, 0.12]} />
              </mesh>
              {/* Latch tabs, tilted outward */}
              <mesh position={[0, 0.13, 1.56]} rotation={[0.3, 0, 0]} castShadow material={mat('plasticGloss')}>
                <boxGeometry args={[0.13, 0.26, 0.11]} />
              </mesh>
              <mesh position={[0, 0.13, -1.56]} rotation={[-0.3, 0, 0]} castShadow material={mat('plasticGloss')}>
                <boxGeometry args={[0.13, 0.26, 0.11]} />
              </mesh>
            </group>
          );
        })}
      </Part>

      {/* ————— PCIe: reinforced ×16 Gen5, second ×16, short ×1 ————— */}
      <Part definition={defOf(HW, 'pcie-slots')} position={[-0.9, 0.05, 0]}>
        {/* Primary ×16 — steel reinforcement sleeve around the body */}
        <mesh position={[0, 0.065, 0.75]} castShadow receiveShadow material={mat('steel')}>
          <boxGeometry args={[2.5, 0.13, 0.21]} />
        </mesh>
        <mesh position={[0, 0.085, 0.75]} castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[2.42, 0.17, 0.14]} />
        </mesh>
        <mesh position={[-0.94, 0.172, 0.75]} material={mat('goldContact')}>
          <boxGeometry args={[0.44, 0.006, 0.045]} />
        </mesh>
        <mesh position={[0.25, 0.172, 0.75]} material={mat('goldContact')}>
          <boxGeometry args={[1.78, 0.006, 0.045]} />
        </mesh>
        <mesh position={[1.28, 0.11, 0.75]} castShadow material={mat('plasticGloss')}>
          <boxGeometry args={[0.12, 0.22, 0.15]} />
        </mesh>
        {/* Secondary ×16 (chipset lanes) */}
        <mesh position={[0, 0.08, 1.8]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[2.5, 0.16, 0.18]} />
        </mesh>
        <mesh position={[-0.94, 0.163, 1.8]} material={mat('goldContact')}>
          <boxGeometry args={[0.44, 0.006, 0.045]} />
        </mesh>
        <mesh position={[0.25, 0.163, 1.8]} material={mat('goldContact')}>
          <boxGeometry args={[1.78, 0.006, 0.045]} />
        </mesh>
        <mesh position={[1.3, 0.1, 1.8]} castShadow material={mat('plasticGloss')}>
          <boxGeometry args={[0.1, 0.2, 0.14]} />
        </mesh>
        {/* Short ×1 */}
        <mesh position={[-0.85, 0.08, 2.55]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.75, 0.16, 0.18]} />
        </mesh>
        <mesh position={[-1.05, 0.163, 2.55]} material={mat('goldContact')}>
          <boxGeometry args={[0.16, 0.006, 0.045]} />
        </mesh>
        <mesh position={[-0.7, 0.163, 2.55]} material={mat('goldContact')}>
          <boxGeometry args={[0.42, 0.006, 0.045]} />
        </mesh>
      </Part>

      {/* ————— Chipset: layered brushed plateau + status LED ————— */}
      <Part definition={defOf(HW, 'chipset')} position={[1.6, 0.05, 1.5]}>
        <RoundedBox args={[1.05, 0.12, 1.05]} radius={0.04} smoothness={2} position={[0, 0.06, 0]} castShadow receiveShadow material={mat('brushedAluminum')} />
        <mesh position={[0, 0.125, 0]} material={mat('darkMetal')}>
          <boxGeometry args={[0.86, 0.03, 0.86]} />
        </mesh>
        <RoundedBox args={[0.66, 0.07, 0.66]} radius={0.03} smoothness={2} position={[0, 0.165, 0]} castShadow material={mat('brushedAluminum')} />
        {/* Engraved diagonal groove */}
        <mesh position={[0, 0.203, 0]} rotation={[0, Math.PI / 4, 0]} material={mat('darkMetal')}>
          <boxGeometry args={[0.55, 0.012, 0.05]} />
        </mesh>
        {/* Orange status LED */}
        <mesh position={[0.42, 0.135, 0.42]} material={mat('rgbRing')}>
          <boxGeometry args={[0.06, 0.02, 0.06]} />
        </mesh>
      </Part>

      {/* ————— M.2: one shielded Gen5 slot + one open Gen4 socket ————— */}
      <Part definition={defOf(HW, 'm2-slots')} position={[-0.35, 0.05, 0]}>
        {/* Covered slot: brushed heatsink plate + retention screw */}
        <RoundedBox args={[2.3, 0.07, 0.62]} radius={0.03} smoothness={2} position={[0, 0.14, 1.27]} castShadow receiveShadow material={mat('brushedAluminum')} />
        <mesh position={[0, 0.178, 1.02]} material={mat('darkMetal')}>
          <boxGeometry args={[2.1, 0.006, 0.04]} />
        </mesh>
        <mesh position={[0.95, 0.185, 1.27]} castShadow material={mat('steel')}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
        </mesh>
        {/* Open slot: connector with M-key gap + standoff at 2280 */}
        <mesh position={[-1.0, 0.05, 2.15]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.16, 0.1, 0.5]} />
        </mesh>
        <mesh position={[-1.0, 0.105, 2.06]} material={mat('goldContact')}>
          <boxGeometry args={[0.06, 0.012, 0.3]} />
        </mesh>
        <mesh position={[-1.0, 0.105, 2.31]} material={mat('goldContact')}>
          <boxGeometry args={[0.06, 0.012, 0.08]} />
        </mesh>
        <mesh position={[1.0, 0.04, 2.15]} castShadow material={mat('steel')}>
          <cylinderGeometry args={[0.045, 0.045, 0.08, 10]} />
        </mesh>
        <mesh position={[1.0, 0.088, 2.15]} material={mat('steel')}>
          <cylinderGeometry args={[0.055, 0.055, 0.016, 10]} />
        </mesh>
      </Part>

      {/* ————— Filter capacitors: bodies + engraved tops ————— */}
      <Part definition={defOf(HW, 'capacitors')} position={[0, 0.05, 0]}>
        <Instanced transforms={caps} material={mat('darkMetal')}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 12]} />
        </Instanced>
        <Instanced transforms={capTops} material={mat('steel')} castShadow={false}>
          <cylinderGeometry args={[0.052, 0.052, 0.012, 12]} />
        </Instanced>
      </Part>

      {/* ————— CMOS coin cell in a plastic holder ————— */}
      <Part definition={defOf(HW, 'cmos-battery')} position={[0.95, 0.05, 2.35]}>
        <mesh position={[0, 0.025, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('plasticMatte')}>
          <torusGeometry args={[0.2, 0.02, 8, 28]} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow material={mat('steel')}>
          <cylinderGeometry args={[0.17, 0.17, 0.04, 28]} />
        </mesh>
        {/* Retaining clip */}
        <mesh position={[0.16, 0.085, 0]} castShadow material={mat('steel')}>
          <boxGeometry args={[0.08, 0.03, 0.18]} />
        </mesh>
      </Part>

      {/* ————— 24-pin ATX power: shrouded 2 × 12 connector ————— */}
      <Part definition={defOf(HW, 'atx-connector')} position={[2.28, 0.05, -0.5]}>
        <mesh position={[0, 0.17, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.32, 0.34, 1.35]} />
        </mesh>
        {/* Pin holes inset on top */}
        <Instanced transforms={atxPins} material={mat('chipLabel')} castShadow={false}>
          <boxGeometry args={[0.055, 0.02, 0.05]} />
        </Instanced>
        {/* Latch rail on the outer face */}
        <mesh position={[0.2, 0.11, 0]} castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.05, 0.22, 0.28]} />
        </mesh>
      </Part>

      {/* ————— USB / front-panel headers along the bottom edge ————— */}
      <Part definition={defOf(HW, 'usb-headers')} position={[0.4, 0.05, 2.75]}>
        {/* Shrouded USB 3.0 19-pin header */}
        <mesh position={[-1.3, 0.1, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.55, 0.2, 0.26]} />
        </mesh>
        <mesh position={[-1.3, 0.2, 0]} material={mat('chipLabel')}>
          <boxGeometry args={[0.47, 0.02, 0.18]} />
        </mesh>
        {/* Bare pin headers: 2 × USB 2.0 + front-panel block */}
        <mesh position={[-0.5, 0.035, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.45, 0.07, 0.22]} />
        </mesh>
        <mesh position={[0.05, 0.035, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.45, 0.07, 0.22]} />
        </mesh>
        <mesh position={[1.1, 0.035, 0]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.65, 0.07, 0.22]} />
        </mesh>
        <Instanced transforms={headerPins} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.028, 0.16, 0.028]} />
        </Instanced>
      </Part>

      {/* ————— I/O shroud: angular brushed wedge + rear port stack ————— */}
      <Part definition={defOf(HW, 'io-cover')} position={[-2.2, 0.05, -1.45]}>
        <Extrude args={[shroudShape, shroudExtrude]} position={[-0.24, 0, -1.4]} castShadow receiveShadow material={mat('brushedAluminum')} />
        {/* Top plateau plate */}
        <mesh position={[-0.12, 0.45, 0]} castShadow material={mat('paintedMetal')}>
          <boxGeometry args={[0.22, 0.03, 2.5]} />
        </mesh>
        {/* Orange accent stripe along the angled facet */}
        <mesh position={[0.136, 0.276, 0]} rotation={[0, 0, -Math.PI / 4]} material={mat('rgbRing')}>
          <boxGeometry args={[0.06, 0.014, 2.6]} />
        </mesh>
        {/* Rear port block peeking past the board edge */}
        <mesh position={[-0.32, 0.15, -0.9]} castShadow receiveShadow material={mat('steel')}>
          <boxGeometry args={[0.16, 0.26, 0.5]} />
        </mesh>
        <mesh position={[-0.32, 0.12, -0.35]} castShadow receiveShadow material={mat('steel')}>
          <boxGeometry args={[0.16, 0.2, 0.4]} />
        </mesh>
        <mesh position={[-0.32, 0.16, 0.25]} castShadow receiveShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.16, 0.26, 0.34]} />
        </mesh>
        {/* Audio jack cluster */}
        {[0.85, 1.05, 1.25].map((z) => (
          <mesh key={z} position={[-0.34, 0.15, z]} rotation={[0, 0, Math.PI / 2]} castShadow material={mat('plasticGloss')}>
            <cylinderGeometry args={[0.055, 0.055, 0.14, 14]} />
          </mesh>
        ))}
      </Part>

      {/* ——— Educational animations (orange / teal palette) ——— */}
      <Anim id="power-distribution">
        {/* 12 V in at the 24-pin, up through the top VRM bank to the socket */}
        <FlowPath
          points={[
            [2.3, 0.42, -0.5],
            [1.35, 0.35, -2.0],
            [0.1, 0.42, -2.7],
            [-0.45, 0.45, -2.7],
            [-0.45, 0.3, -2.0],
            [SOCKET[0], 0.25, SOCKET[1]],
          ]}
          count={16}
          color="#f6821f"
        />
        {/* Second rail through the left VRM bank */}
        <FlowPath
          points={[
            [2.3, 0.42, -0.5],
            [1.0, 0.4, -0.6],
            [-0.7, 0.4, -0.5],
            [-1.73, 0.45, -1.5],
            [-1.0, 0.3, -1.45],
            [SOCKET[0], 0.25, SOCKET[1]],
          ]}
          count={12}
          color="#ffb25e"
          phase={0.5}
        />
        <PulseRing radius={1.0} color="#f6821f" position={[SOCKET[0], 0.24, SOCKET[1]]} rate={2} />
      </Anim>

      <Anim id="pcie-communication">
        {/* CPU-attached ×16 Gen5 lanes */}
        <FlowPath
          points={[
            [SOCKET[0], 0.25, SOCKET[1]],
            [-0.7, 0.35, -0.3],
            [-0.9, 0.25, 0.75],
          ]}
          count={12}
          color="#f6821f"
        />
        {/* DMI link: socket → chipset */}
        <FlowPath
          points={[
            [SOCKET[0], 0.25, SOCKET[1]],
            [0.6, 0.4, 0.1],
            [1.6, 0.3, 1.5],
          ]}
          count={10}
          color="#ffb25e"
          phase={0.2}
        />
        {/* Chipset lanes → secondary ×16 */}
        <FlowPath
          points={[
            [1.6, 0.28, 1.5],
            [0.3, 0.35, 1.65],
            [-0.9, 0.25, 1.8],
          ]}
          count={8}
          color="#0fa48e"
          phase={0.4}
        />
      </Anim>

      <Anim id="memory-routing">
        {DIMM_X.map((x, i) => (
          <FlowPath
            key={i}
            points={[
              [SOCKET[0], 0.25, SOCKET[1]],
              [0.35, 0.35, -1.4],
              [x, 0.28, -1.3],
            ]}
            count={8}
            size={0.04}
            color={i % 2 ? '#0fa48e' : '#f6821f'}
            phase={i * 0.25}
          />
        ))}
      </Anim>
    </group>
  );
}
