'use client';

import { useMemo } from 'react';
import { Extrude, RoundedBox } from '@react-three/drei';
import { Shape } from 'three';
import { Part } from '@/three/Part';
import { ActivityGrid, Anim, FlowPath, PulseRing } from '@/three/eduFx';
import type { InstanceTransform } from './common';
import { defOf, Instanced, useMat } from './common';

const HW = 'ssd' as const;

/* Palette for educational FX (bright-studio theme). */
const FX_ORANGE = '#f6821f';
const FX_ORANGE_LIGHT = '#ffb25e';
const FX_TEAL = '#0fa48e';

/* Board dimensions — M.2 2280 lying flat, long axis X. 1 unit ≈ 10 mm
 * squeezed to the registry bounds of [3.4, 0.4, 1.0]. */
const L = 1.6; // half length (X)
const W = 0.45; // half width (Z)
const T = 0.06; // board thickness
const CORNER = 0.05; // corner radius
const NOTCH_R = 0.085; // mounting-notch semicircle radius
const KEY_LO = 0.2; // M-key slot, near-side edge (Z)
const KEY_HI = 0.3; // M-key slot, far-side edge (Z)
const PCB_TOP = T / 2;

/**
 * SSD — M.2 2280 NVMe drive. Extruded black PCB with the real M.2 outline
 * (M-key slot at the connector edge, semicircular mounting notch at the back),
 * gold edge fingers, controller SoC, DRAM cache, two NAND packages and a
 * garnish layer of passives, PMIC, inductor, oscillator and silkscreen.
 */
export function SsdModel() {
  const mat = useMat();

  /* ——— Real M.2 outline: rounded corners, M-key slot, mounting notch ——— */
  const boardShape = useMemo(() => {
    const s = new Shape();
    // Shape space: x = world X, y = world Z (mesh rotated Math.PI/2 about X).
    s.moveTo(-L + CORNER, -W);
    s.lineTo(L - CORNER, -W);
    s.quadraticCurveTo(L, -W, L, -W + CORNER);
    s.lineTo(L, -NOTCH_R);
    // Semicircular mounting notch cut inward from the back-edge center.
    s.absarc(L, 0, NOTCH_R, -Math.PI / 2, Math.PI / 2, true);
    s.lineTo(L, W - CORNER);
    s.quadraticCurveTo(L, W, L - CORNER, W);
    s.lineTo(-L + CORNER, W);
    s.quadraticCurveTo(-L, W, -L, W - CORNER);
    // M-key slot notched into the connector edge, offset toward one side.
    s.lineTo(-L, KEY_HI);
    s.lineTo(-L + 0.12, KEY_HI);
    s.lineTo(-L + 0.12, KEY_LO);
    s.lineTo(-L, KEY_LO);
    s.lineTo(-L, -W + CORNER);
    s.quadraticCurveTo(-L, -W, -L + CORNER, -W);
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({ depth: T, bevelEnabled: false, curveSegments: 24 }),
    [],
  );

  /* ——— M-key gold edge fingers (top & bottom faces) ——— */
  const fingers = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 26; i++) {
      const z = -0.4 + i * 0.032;
      if (z > KEY_LO - 0.015 && z < KEY_HI + 0.015) continue; // M-key gap
      out.push({ position: [0, 0.036, z] });
      out.push({ position: [0, -0.036, z] });
    }
    return out;
  }, []);

  /* ——— Garnish: micro MLCC passives (dark bodies) ——— */
  const darkPassives = useMemo(() => {
    const out: InstanceTransform[] = [];
    // Decoupling column between connector and controller.
    for (let i = 0; i < 6; i++) out.push({ position: [-1.27, 0.041, -0.3 + i * 0.12] });
    // Rows flanking the controller.
    for (let i = 0; i < 4; i++) {
      out.push({ position: [-1.13 + i * 0.12, 0.041, 0.38] });
      out.push({ position: [-1.13 + i * 0.12, 0.041, -0.38], rotation: [0, Math.PI / 2, 0] });
    }
    // Column between controller and DRAM.
    for (let i = 0; i < 4; i++) out.push({ position: [-0.6, 0.041, -0.18 + i * 0.12] });
    // Column in the channel between the two NAND packages (rotated to fit).
    for (let i = 0; i < 5; i++)
      out.push({ position: [0.84, 0.041, -0.24 + i * 0.12], rotation: [0, Math.PI / 2, 0] });
    // Short column between DRAM and the first NAND package.
    for (let i = 0; i < 4; i++) out.push({ position: [0.07, 0.041, -0.3 + i * 0.12] });
    return out;
  }, []);

  /* ——— Garnish: copper-terminated resistors / fuses ——— */
  const copperPassives = useMemo<InstanceTransform[]>(
    () => [
      { position: [-1.0, 0.04, 0.32] },
      { position: [-1.0, 0.04, 0.18] },
      { position: [-0.98, 0.04, -0.06], rotation: [0, Math.PI / 2, 0] },
      { position: [-0.7, 0.04, 0.36], rotation: [0, Math.PI / 2, 0] },
      { position: [0.07, 0.04, 0.22] },
      { position: [0.55, 0.04, -0.42] },
      { position: [1.28, 0.04, -0.41] },
    ],
    [],
  );

  /* ——— Garnish: flat gold test points ——— */
  const testPoints = useMemo<InstanceTransform[]>(
    () => [
      { position: [-1.05, 0.032, -0.05] },
      { position: [-0.45, 0.032, 0.4] },
      { position: [-0.2, 0.032, -0.34] },
      { position: [0.3, 0.032, 0.41] },
      { position: [0.68, 0.032, -0.41] },
      { position: [1.0, 0.032, 0.41] },
      { position: [1.52, 0.032, -0.3] },
    ],
    [],
  );

  /* ——— Garnish: white silkscreen suggestion (very thin light strips) ——— */
  const silkscreen = useMemo<InstanceTransform[]>(
    () => [
      { position: [0, 0.033, 0.435], scale: [2.4, 1, 0.014] }, // front border line
      { position: [-1.0, 0.033, -0.41], scale: [0.5, 1, 0.02] }, // part-number block
      { position: [-0.33, 0.033, -0.4], scale: [0.3, 1, 0.018] }, // DRAM designator
      { position: [0.5, 0.033, -0.43], scale: [0.6, 1, 0.014] }, // rear border line
      { position: [1.35, 0.033, -0.4], scale: [0.35, 1, 0.02] }, // rev / cert marks
    ],
    [],
  );

  return (
    <group position={[0, 0.05, 0]}>
      {/* ——— M.2 PCB with real outline + on-board garnish ——— */}
      <Part definition={defOf(HW, 'pcb')} position={[0, 0, 0]}>
        <Extrude
          args={[boardShape, extrudeSettings]}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, PCB_TOP, 0]}
          castShadow
          receiveShadow
          material={mat('pcbBlack')}
        />

        {/* Gold plating around the mounting notch (top & bottom) */}
        <mesh position={[L, PCB_TOP + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('goldContact')}>
          <ringGeometry args={[0.09, 0.15, 24, 1, Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[L, -PCB_TOP - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('goldContact')}>
          <ringGeometry args={[0.09, 0.15, 24, 1, Math.PI / 2, Math.PI]} />
        </mesh>

        {/* Micro passives, resistors, gold test points */}
        <Instanced transforms={darkPassives} material={mat('darkMetal')} castShadow={false}>
          <boxGeometry args={[0.045, 0.022, 0.026]} />
        </Instanced>
        <Instanced transforms={copperPassives} material={mat('copper')} castShadow={false}>
          <boxGeometry args={[0.05, 0.02, 0.024]} />
        </Instanced>
        <Instanced transforms={testPoints} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.03, 0.004, 0.03]} />
        </Instanced>

        {/* Power stage: PMIC + shielded inductor near the connector */}
        <RoundedBox args={[0.15, 0.045, 0.15]} radius={0.01} smoothness={2} position={[-1.15, 0.052, -0.24]} castShadow material={mat('chipLabel')} />
        <RoundedBox args={[0.16, 0.06, 0.16]} radius={0.03} smoothness={2} position={[-1.13, 0.06, 0.1]} castShadow material={mat('steel')} />

        {/* Crystal oscillator beside the controller */}
        <RoundedBox args={[0.12, 0.04, 0.07]} radius={0.018} smoothness={2} position={[-0.6, 0.05, -0.33]} castShadow material={mat('steel')} />

        {/* Silkscreen strips */}
        <Instanced transforms={silkscreen} material={mat('plasticLight')} castShadow={false}>
          <boxGeometry args={[1, 0.004, 1]} />
        </Instanced>
      </Part>

      {/* ——— M-key edge connector: gold fingers + connector body strip ——— */}
      <Part definition={defOf(HW, 'connector')} position={[-1.49, 0, 0]}>
        <Instanced transforms={fingers} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.2, 0.006, 0.02]} />
        </Instanced>
        <mesh position={[0.13, 0, 0]} castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.05, 0.08, 0.88]} />
        </mesh>
      </Part>

      {/* ——— NVMe controller SoC (nearest the connector) ——— */}
      <Part definition={defOf(HW, 'controller')} position={[-0.95, 0.062, 0]}>
        <RoundedBox args={[0.62, 0.065, 0.62]} radius={0.015} smoothness={2} castShadow receiveShadow material={mat('chipSilk')} />
        {/* Laser-etch marking plate, slightly raised */}
        <mesh position={[0, 0.036, -0.04]} material={mat('chipLabel')}>
          <boxGeometry args={[0.44, 0.005, 0.28]} />
        </mesh>
        {/* Pin-1 dimple */}
        <mesh position={[-0.24, 0.036, 0.24]} material={mat('plasticLight')}>
          <cylinderGeometry args={[0.016, 0.016, 0.004, 12]} />
        </mesh>
      </Part>

      {/* ——— DRAM cache ——— */}
      <Part definition={defOf(HW, 'dram-cache')} position={[-0.33, 0.06, 0]}>
        <RoundedBox args={[0.46, 0.06, 0.62]} radius={0.012} smoothness={2} castShadow receiveShadow material={mat('chipLabel')} />
        <mesh position={[0, 0.033, -0.12]} material={mat('chipSilk')}>
          <boxGeometry args={[0.3, 0.004, 0.14]} />
        </mesh>
      </Part>

      {/* ——— Two NAND flash packages filling the back half ——— */}
      <Part definition={defOf(HW, 'nand-flash')} position={[0, 0.062, 0]}>
        <RoundedBox args={[0.62, 0.065, 0.76]} radius={0.015} smoothness={2} position={[0.5, 0, 0]} castShadow receiveShadow material={mat('chipLabel')} />
        <RoundedBox args={[0.62, 0.065, 0.76]} radius={0.015} smoothness={2} position={[1.18, 0, 0]} castShadow receiveShadow material={mat('chipLabel')} />
        {/* Laser-etch label plates */}
        <mesh position={[0.5, 0.036, -0.16]} material={mat('chipSilk')}>
          <boxGeometry args={[0.42, 0.004, 0.2]} />
        </mesh>
        <mesh position={[1.18, 0.036, -0.16]} material={mat('chipSilk')}>
          <boxGeometry args={[0.42, 0.004, 0.2]} />
        </mesh>
      </Part>

      {/* ——— Educational animations ——— */}
      <Anim id="nand-access">
        {/* Controller striping a read across both NAND channels */}
        <FlowPath points={[[-0.95, 0.14, 0], [-0.25, 0.24, 0.18], [0.5, 0.14, 0.12]]} count={10} color={FX_ORANGE} />
        <FlowPath points={[[-0.95, 0.14, 0], [-0.25, 0.24, -0.18], [0.5, 0.14, -0.12]]} count={10} color={FX_ORANGE_LIGHT} phase={0.25} />
        <FlowPath points={[[-0.95, 0.14, 0], [0.1, 0.28, 0.2], [1.18, 0.14, 0.12]]} count={10} color={FX_ORANGE} phase={0.5} />
        <FlowPath points={[[-0.95, 0.14, 0], [0.1, 0.28, -0.2], [1.18, 0.14, -0.12]]} count={10} color={FX_ORANGE_LIGHT} phase={0.75} />
        {/* Flash dies lighting up under each package */}
        <ActivityGrid rows={3} cols={4} cellSize={0.11} gap={0.038} height={0.024} color={FX_TEAL} mode="random" position={[0.5, 0.13, 0]} />
        <ActivityGrid rows={3} cols={4} cellSize={0.11} gap={0.038} height={0.024} color={FX_TEAL} mode="random" position={[1.18, 0.13, 0]} />
      </Anim>

      <Anim id="controller-flow">
        {/* Host commands: PCIe edge → DRAM map lookup → controller */}
        <FlowPath
          points={[
            [-1.6, 0.08, 0.06],
            [-1.2, 0.2, 0.24],
            [-0.33, 0.18, 0.16],
            [-0.5, 0.22, -0.08],
            [-0.95, 0.14, 0],
          ]}
          count={14}
          color={FX_ORANGE}
        />
        {/* Dispatch to the flash array */}
        <FlowPath points={[[-0.95, 0.14, 0], [0.2, 0.24, 0], [1.18, 0.14, 0]]} count={10} color={FX_ORANGE_LIGHT} phase={0.3} />
        <PulseRing radius={0.5} color={FX_TEAL} position={[-0.95, 0.13, 0]} rate={3} />
      </Anim>
    </group>
  );
}
