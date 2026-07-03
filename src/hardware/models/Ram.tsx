'use client';

import { useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { RoundedBox } from '@react-three/drei';
import { Part } from '@/three/Part';
import { ActivityGrid, Anim, FlowPath } from '@/three/eduFx';
import type { InstanceTransform } from './common';
import { defOf, Instanced, useMat } from './common';

const HW = 'ram' as const;

/* ——— PCB silhouette ——— */
const PCB_HW = 2.2; // half width
const PCB_BOT = -0.75;
const PCB_TOP = 0.45;
const PCB_T = 0.05;
const KEY_X = 0.35; // DDR5 key notch, offset from center
const KEY_R = 0.06;
const LATCH_Y = -0.28; // side latch notch center
const LATCH_R = 0.1;

/* ——— Heat spreader silhouette ——— */
const SPR_HW = 2.18;
const SPR_BOT = -0.5;
const SPR_T = 0.05;
const SPR_Z = 0.108; // shell center distance from PCB plane

/* Eight DRAM packages, evenly spaced across the front face. */
const CHIP_X = Array.from({ length: 8 }, (_, i) => -1.86 + i * 0.5314);
const CHIP_Y = 0.05;

/**
 * RAM — performance DDR5 UDIMM standing upright (PCB in the XY plane).
 * Extruded black PCB with the asymmetric DDR5 key notch and side latch
 * notches, 288-pin style gold fingers, eight DRAM packages, on-module
 * PMIC cluster and angular dual aluminum heat spreaders with a finned crown.
 */
export function RamModel() {
  const mat = useMat();

  /* PCB outline: chamfered corners, DDR5 key notch, side latch notches. */
  const pcbGeom = useMemo(() => {
    const s = new Shape();
    s.moveTo(-PCB_HW + 0.07, PCB_BOT);
    // bottom edge → key notch (U-shaped, offset from center)
    s.lineTo(KEY_X - KEY_R, PCB_BOT);
    s.lineTo(KEY_X - KEY_R, PCB_BOT + 0.06);
    s.absarc(KEY_X, PCB_BOT + 0.06, KEY_R, Math.PI, 0, true);
    s.lineTo(KEY_X + KEY_R, PCB_BOT);
    s.lineTo(PCB_HW - 0.07, PCB_BOT);
    s.lineTo(PCB_HW, PCB_BOT + 0.07);
    // right edge with latch notch
    s.lineTo(PCB_HW, LATCH_Y - LATCH_R);
    s.absarc(PCB_HW, LATCH_Y, LATCH_R, -Math.PI / 2, Math.PI / 2, true);
    s.lineTo(PCB_HW, PCB_TOP - 0.14);
    s.lineTo(PCB_HW - 0.14, PCB_TOP);
    // top edge, chamfered corners
    s.lineTo(-PCB_HW + 0.14, PCB_TOP);
    s.lineTo(-PCB_HW, PCB_TOP - 0.14);
    // left edge with latch notch
    s.lineTo(-PCB_HW, LATCH_Y + LATCH_R);
    s.absarc(-PCB_HW, LATCH_Y, LATCH_R, Math.PI / 2, -Math.PI / 2, true);
    s.lineTo(-PCB_HW, PCB_BOT + 0.07);
    s.closePath();

    const g = new ExtrudeGeometry(s, { depth: PCB_T, bevelEnabled: false, curveSegments: 20 });
    g.translate(0, 0, -PCB_T / 2);
    return g;
  }, []);

  /* Angular spreader shell: diagonal shoulders + shallow step in the top. */
  const spreaderGeom = useMemo(() => {
    const s = new Shape();
    s.moveTo(-SPR_HW + 0.1, SPR_BOT);
    s.lineTo(SPR_HW - 0.1, SPR_BOT);
    s.lineTo(SPR_HW, SPR_BOT + 0.1);
    s.lineTo(SPR_HW, 0.18);
    s.lineTo(1.45, 0.54); // right diagonal shoulder
    s.lineTo(0.4, 0.54);
    s.lineTo(0.24, 0.44); // shallow step / groove notch
    s.lineTo(-0.85, 0.44);
    s.lineTo(-1.01, 0.54);
    s.lineTo(-1.75, 0.54);
    s.lineTo(-SPR_HW, 0.3); // left diagonal shoulder
    s.lineTo(-SPR_HW, SPR_BOT + 0.1);
    s.closePath();

    const g = new ExtrudeGeometry(s, {
      depth: SPR_T,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 1,
    });
    g.translate(0, 0, -SPR_T / 2);
    return g;
  }, []);

  /* Gold edge fingers — two rows, interrupted at the key notch. */
  const fingers = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 60; i++) {
      const x = -2.13 + i * 0.0722;
      if (Math.abs(x - KEY_X) < 0.1) continue; // key notch gap
      out.push({ position: [x, -0.63, 0.027] });
      out.push({ position: [x, -0.63, -0.027] });
    }
    return out;
  }, []);

  /* Laser-etched marking lines on each DRAM package. */
  const chipMarks = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (const x of CHIP_X) {
      out.push({ position: [x, CHIP_Y + 0.09, 0.0775] });
      out.push({ position: [x - 0.02, CHIP_Y, 0.0775], scale: [0.72, 1, 1] });
      out.push({ position: [x + 0.1, CHIP_Y - 0.17, 0.0775], scale: [0.35, 1, 1] });
    }
    return out;
  }, []);

  /* Decoupling passives sprinkled along the PCB (front + back). */
  const pcbPassives = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 22; i++) {
      const x = -2.02 + i * 0.192;
      if (Math.abs(x) < 0.55) continue; // keep the PMIC zone clear
      const h = Math.sin(i * 12.9898) * 43758.5453;
      const jitter = (h - Math.floor(h)) * 0.05 - 0.025;
      out.push({ position: [x, -0.47 + jitter, 0.033] });
    }
    for (let i = 0; i < 11; i++) {
      out.push({ position: [-1.9 + i * 0.38, 0.375, 0.033], rotation: [0, 0, Math.PI / 2] });
    }
    for (let i = 0; i < 12; i++) {
      out.push({ position: [-1.98 + i * 0.36, -0.45, -0.033] });
    }
    return out;
  }, []);

  /* Micro passives ringing the PMIC. */
  const pmicPassives = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 5; i++) out.push({ position: [-0.16 + i * 0.08, -0.185, 0.036] });
    for (let i = 0; i < 5; i++) out.push({ position: [-0.16 + i * 0.08, -0.465, 0.036] });
    for (let i = 0; i < 3; i++) {
      out.push({ position: [0.21, -0.39 + i * 0.06, 0.036], rotation: [0, 0, Math.PI / 2] });
    }
    return out;
  }, []);

  /* Crown fins along the top bar. */
  const crownFins = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 8; i++) {
      out.push({ position: [-0.15 + (i - 3.5) * 0.42, 0.66, 0] });
    }
    return out;
  }, []);

  const readX = [1, 3, 4, 6].map((i) => CHIP_X[i]);

  return (
    <group position={[0, 0.03, 0]}>
      {/* Module PCB — extruded 10-layer board, DDR5 keying */}
      <Part definition={defOf(HW, 'pcb')} position={[0, 0, 0]}>
        <mesh geometry={pcbGeom} castShadow receiveShadow material={mat('pcbBlack')} />
        <Instanced transforms={pcbPassives} material={mat('darkMetal')} castShadow={false}>
          <boxGeometry args={[0.05, 0.022, 0.025]} />
        </Instanced>
      </Part>

      {/* Gold edge contacts — fine fingers, interrupted at the key notch */}
      <Part definition={defOf(HW, 'gold-contacts')} position={[0, 0, 0]}>
        <Instanced transforms={fingers} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.03, 0.2, 0.008]} />
        </Instanced>
      </Part>

      {/* DRAM packages — eight beveled BGA parts with etched markings */}
      <Part definition={defOf(HW, 'memory-chips')} position={[0, 0, 0]}>
        {CHIP_X.map((x) => (
          <RoundedBox
            key={x}
            args={[0.42, 0.5, 0.05]}
            radius={0.015}
            smoothness={2}
            position={[x, CHIP_Y, 0.05]}
            castShadow
            receiveShadow
            material={mat('chipLabel')}
          />
        ))}
        <Instanced transforms={chipMarks} material={mat('chipSilk')} castShadow={false}>
          <boxGeometry args={[0.3, 0.045, 0.004]} />
        </Instanced>
      </Part>

      {/* PMIC — on-module power cluster, center-bottom */}
      <Part definition={defOf(HW, 'pmic')} position={[0, 0, 0]}>
        <RoundedBox
          args={[0.24, 0.24, 0.045]}
          radius={0.012}
          smoothness={2}
          position={[0, -0.33, 0.047]}
          castShadow
          material={mat('chipSilk')}
        />
        {/* SPD hub companion */}
        <mesh position={[0.38, -0.32, 0.044]} castShadow material={mat('chipLabel')}>
          <boxGeometry args={[0.16, 0.13, 0.038]} />
        </mesh>
        {/* Rail inductors */}
        <mesh position={[-0.3, -0.26, 0.052]} castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.1, 0.1, 0.055]} />
        </mesh>
        <mesh position={[-0.3, -0.4, 0.052]} castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.1, 0.1, 0.055]} />
        </mesh>
        <Instanced transforms={pmicPassives} material={mat('darkMetal')} castShadow={false}>
          <boxGeometry args={[0.045, 0.025, 0.03]} />
        </Instanced>
      </Part>

      {/* Heat spreader — front shell, thermal pad, trim + crown bar */}
      <Part definition={defOf(HW, 'heat-spreader-front')} position={[0, 0, 0]}>
        <mesh geometry={spreaderGeom} position={[0, 0, SPR_Z]} castShadow receiveShadow material={mat('shroudLight')} />
        {/* thermal pad against the DRAM faces */}
        <mesh position={[0, 0.05, 0.08]} material={mat('thermalPaste')}>
          <boxGeometry args={[4.0, 0.72, 0.014]} />
        </mesh>
        {/* machined groove + inset panel + orange accent slash */}
        <mesh position={[0, -0.32, 0.145]} material={mat('darkMetal')}>
          <boxGeometry args={[4.15, 0.035, 0.01]} />
        </mesh>
        <mesh position={[-0.55, 0.02, 0.1445]} receiveShadow material={mat('darkMetal')}>
          <boxGeometry args={[1.6, 0.44, 0.012]} />
        </mesh>
        <mesh position={[1.35, 0.12, 0.145]} rotation={[0, 0, -0.65]} material={mat('rgbRing')}>
          <boxGeometry args={[0.42, 0.05, 0.01]} />
        </mesh>
        {/* crown bar spanning both shells, with fin blocks */}
        <RoundedBox
          args={[3.2, 0.09, 0.27]}
          radius={0.02}
          smoothness={2}
          position={[-0.15, 0.585, 0]}
          castShadow
          material={mat('brushedAluminum')}
        />
        <Instanced transforms={crownFins} material={mat('brushedAluminum')}>
          <boxGeometry args={[0.24, 0.09, 0.27]} />
        </Instanced>
      </Part>

      {/* Heat spreader — back shell */}
      <Part definition={defOf(HW, 'heat-spreader-back')} position={[0, 0, 0]}>
        <mesh geometry={spreaderGeom} position={[0, 0, -SPR_Z]} castShadow receiveShadow material={mat('shroudLight')} />
        {/* thick pad bridging shell → bare PCB back */}
        <mesh position={[0, 0, -0.055]} material={mat('thermalPaste')}>
          <boxGeometry args={[4.0, 0.9, 0.03]} />
        </mesh>
        <mesh position={[0, -0.32, -0.145]} material={mat('darkMetal')}>
          <boxGeometry args={[4.15, 0.035, 0.01]} />
        </mesh>
        <mesh position={[0.55, 0.02, -0.1445]} receiveShadow material={mat('darkMetal')}>
          <boxGeometry args={[1.6, 0.44, 0.012]} />
        </mesh>
        <mesh position={[-1.35, 0.12, -0.145]} rotation={[0, 0, 0.65]} material={mat('rgbRing')}>
          <boxGeometry args={[0.42, 0.05, 0.01]} />
        </mesh>
      </Part>

      {/* ——— Educational animations ——— */}

      {/* Read: rows light up, bursts stream from DRAM down to the fingers */}
      <Anim id="read-cycle">
        {readX.map((x, i) => (
          <FlowPath
            key={x}
            points={[
              [x, 0.28, 0.17],
              [x, -0.2, 0.19],
              [x, -0.63, 0.16],
            ]}
            count={8}
            size={0.035}
            color="#0fa48e"
            phase={i * 0.22}
          />
        ))}
        <group position={[0, CHIP_Y, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <ActivityGrid rows={3} cols={24} cellSize={0.14} gap={0.032} height={0.05} color="#0fa48e" mode="wave" />
        </group>
      </Anim>

      {/* Write: data driven from the bus up into open DRAM rows */}
      <Anim id="write-cycle">
        {readX.map((x, i) => (
          <FlowPath
            key={x}
            points={[
              [x, -0.63, 0.16],
              [x, -0.2, 0.19],
              [x, 0.28, 0.17],
            ]}
            count={8}
            size={0.035}
            color="#f6821f"
            phase={i * 0.22}
          />
        ))}
        <group position={[0, CHIP_Y, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <ActivityGrid rows={3} cols={24} cellSize={0.14} gap={0.032} height={0.05} color="#ffb25e" mode="random" />
        </group>
      </Anim>

      {/* Data transfer: both 32-bit sub-channels bursting along the edge */}
      <Anim id="data-transfer">
        <FlowPath
          points={[
            [-2.0, -0.63, 0.16],
            [-1.0, -0.38, 0.2],
            [0.1, -0.63, 0.16],
          ]}
          count={12}
          color="#f6821f"
          size={0.04}
        />
        <FlowPath
          points={[
            [0.6, -0.63, 0.16],
            [1.4, -0.38, 0.2],
            [2.1, -0.63, 0.16],
          ]}
          count={12}
          color="#0fa48e"
          size={0.04}
          direction={-1}
        />
        <group position={[0, CHIP_Y, 0.155]} rotation={[Math.PI / 2, 0, 0]}>
          <ActivityGrid rows={2} cols={24} cellSize={0.14} gap={0.032} height={0.035} color="#ffb25e" mode="wave" />
        </group>
      </Anim>
    </group>
  );
}
