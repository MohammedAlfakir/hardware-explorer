'use client';

import { useMemo } from 'react';
import { Extrude, RoundedBox } from '@react-three/drei';
import { Shape } from 'three';
import type { ExtrudeGeometryOptions } from 'three';
import { Part } from '@/three/Part';
import { ActivityGrid, Anim, FlowPath, PulseRing, RisingParticles } from '@/three/eduFx';
import { defOf, gridTransforms, Instanced, useMat, type InstanceTransform } from './common';

const HW = 'cpu' as const;

/* FX palette (bright-studio theme) */
const ORANGE = '#f6821f';
const ORANGE_LIGHT = '#ffb25e';
const TEAL = '#0fa48e';

/* ——— Vertical stack (world Y, package lying flat, top up) ———
 * substrate  [-0.06 .. 0.06]
 * die        [ 0.06 .. 0.13]
 * core/cache [ 0.135 .. 0.195]
 * solder TIM [ 0.1975 .. 0.2325]
 * IHS        [ 0.245 .. 0.54] (skirt reaches down to the substrate)
 */
const SUB_W = 2.9;
const SUB_H = 0.12;
const SUB_TOP = SUB_H / 2;
const DIE_Y = 0.095;
const LAYER_Y = 0.15;
const TIM_Y = 0.215;
const IHS_Y = 0.275; // lid extrusion origin; bottom bevel dips 0.03 below
const SKIRT_H = 0.185; // substrate top -> lid underside
const SKIRT_Y = -0.1225; // skirt center, local to the IHS part

/* IHS silhouette parameters (classic winged LGA lid) */
const IHS_W = 1.32; // body half-width  (x)
const IHS_H = 1.02; // body half-depth  (z)
const IHS_E = 0.4; // wing extension beyond the body
const IHS_C = 0.3; // body corner chamfer
const WING_W = 0.7; // wing half-width
const WING_C = 0.12; // wing corner chamfer

/**
 * CPU — modern LGA desktop processor. Green package substrate with pin-1
 * marker and edge notches, a 28×28 gold land grid with a central capacitor
 * cluster underneath, the internal silicon stack (die, 4×4 core complex,
 * ridged L3 slab, solder TIM) and the iconic winged nickel-plated heat
 * spreader extruded from a chamfered cross profile. 1 unit ≈ 10 mm.
 */
export function CpuModel() {
  const mat = useMat();

  /* LGA land grid — 28×28 lands minus the central capacitor cavity (684). */
  const pads = useMemo(
    () =>
      gridTransforms(28, 28, 0.093, 0.093, 0).filter(
        (t) => Math.abs(t.position[0]) > 0.44 || Math.abs(t.position[2]) > 0.44,
      ),
    [],
  );

  /* MLCC decoupling capacitors: two rows of 15 in the underside cavity,
   * plus two strips of 8 on the topside flanking the die (under the lid). */
  const capBodies = useMemo<InstanceTransform[]>(
    () => [
      ...gridTransforms(15, 2, 0.055, 0.26, 0, [0, -0.078, 0]),
      ...gridTransforms(1, 8, 0, 0.13, 0, [-1.13, 0.078, 0]),
      ...gridTransforms(1, 8, 0, 0.13, 0, [1.13, 0.078, 0]),
    ],
    [],
  );
  const capTerminals = useMemo<InstanceTransform[]>(
    () =>
      capBodies.flatMap((t): InstanceTransform[] => [
        { position: [t.position[0], t.position[1], t.position[2] - 0.052] },
        { position: [t.position[0], t.position[1], t.position[2] + 0.052] },
      ]),
    [capBodies],
  );

  /* 16 execution cores (4×4) and the fine SRAM ridges of the L3 slab. */
  const coreBlocks = useMemo(() => gridTransforms(4, 4, 0.29, 0.29, 0.03), []);
  const cacheRidges = useMemo(() => gridTransforms(1, 14, 0, 0.036, 0.022), []);

  /* Winged, chamfered IHS outline (CCW). */
  const lidShape = useMemo(() => {
    const W = IHS_W;
    const H = IHS_H;
    const T = IHS_H + IHS_E; // wing tip
    const c = IHS_C;
    const w = WING_W;
    const k = WING_C;
    const s = new Shape();
    s.moveTo(W, -(H - c));
    s.lineTo(W, H - c);
    s.lineTo(W - c, H);
    s.lineTo(w, H);
    s.lineTo(w, T - k);
    s.lineTo(w - k, T);
    s.lineTo(-(w - k), T);
    s.lineTo(-w, T - k);
    s.lineTo(-w, H);
    s.lineTo(-(W - c), H);
    s.lineTo(-W, H - c);
    s.lineTo(-W, -(H - c));
    s.lineTo(-(W - c), -H);
    s.lineTo(-w, -H);
    s.lineTo(-w, -(T - k));
    s.lineTo(-(w - k), -T);
    s.lineTo(w - k, -T);
    s.lineTo(w, -(T - k));
    s.lineTo(w, -H);
    s.lineTo(W - c, -H);
    s.closePath();
    return s;
  }, []);

  /* Raised central plateau — a chamfered square where the cooler contacts. */
  const plateauShape = useMemo(() => {
    const P = 1.05;
    const c = 0.32;
    const s = new Shape();
    s.moveTo(P, -(P - c));
    s.lineTo(P, P - c);
    s.lineTo(P - c, P);
    s.lineTo(-(P - c), P);
    s.lineTo(-P, P - c);
    s.lineTo(-P, -(P - c));
    s.lineTo(-(P - c), -P);
    s.lineTo(P - c, -P);
    s.closePath();
    return s;
  }, []);

  const lidExtrude = useMemo<ExtrudeGeometryOptions>(
    () => ({ depth: 0.16, steps: 1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }),
    [],
  );
  const plateauExtrude = useMemo<ExtrudeGeometryOptions>(
    () => ({ depth: 0.06, steps: 1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }),
    [],
  );

  return (
    <group>
      {/* Package substrate — beveled green PCB with pin-1 triangle & notches */}
      <Part definition={defOf(HW, 'substrate')} position={[0, 0, 0]}>
        <RoundedBox args={[SUB_W, SUB_H, SUB_W]} radius={0.03} smoothness={2} castShadow receiveShadow material={mat('pcbGreen')} />
        {/* Pin-1 golden triangle */}
        <mesh position={[-1.26, SUB_TOP + 0.005, 1.26]} rotation={[0, -Math.PI / 4, 0]} material={mat('goldContact')}>
          <cylinderGeometry args={[0.085, 0.085, 0.012, 3]} />
        </mesh>
        {/* Keying notch cutouts on opposite edges */}
        <mesh position={[-1.45, 0, 0]} material={mat('plasticMatte')}>
          <boxGeometry args={[0.07, 0.126, 0.32]} />
        </mesh>
        <mesh position={[1.45, 0, 0]} material={mat('plasticMatte')}>
          <boxGeometry args={[0.07, 0.126, 0.32]} />
        </mesh>
      </Part>

      {/* LGA land grid on the underside */}
      <Part definition={defOf(HW, 'contact-pads')} position={[0, -0.069, 0]}>
        <Instanced transforms={pads} material={mat('goldContact')} castShadow={false}>
          <cylinderGeometry args={[0.034, 0.034, 0.014, 8]} />
        </Instanced>
      </Part>

      {/* Decoupling capacitors — underside cavity cluster + topside strips */}
      <Part definition={defOf(HW, 'smd-caps')} position={[0, 0, 0]}>
        <Instanced transforms={capBodies} material={mat('chipLabel')} castShadow={false}>
          <boxGeometry args={[0.048, 0.04, 0.1]} />
        </Instanced>
        <Instanced transforms={capTerminals} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.05, 0.042, 0.022]} />
        </Instanced>
      </Part>

      {/* Monolithic silicon die */}
      <Part definition={defOf(HW, 'die')} position={[0, DIE_Y, 0]}>
        <mesh castShadow material={mat('silicon')}>
          <boxGeometry args={[1.5, 0.07, 1.85]} />
        </mesh>
      </Part>

      {/* Core complex — 16 cores in a 4×4 grid (educational layer) */}
      <Part definition={defOf(HW, 'core-layer')} position={[0, LAYER_Y, -0.35]}>
        <mesh material={mat('chipLabel')} castShadow={false}>
          <boxGeometry args={[1.32, 0.03, 1.16]} />
        </mesh>
        <Instanced transforms={coreBlocks} material={mat('chipSilk')} castShadow={false}>
          <boxGeometry args={[0.24, 0.03, 0.24]} />
        </Instanced>
      </Part>

      {/* Shared L3 cache — flat slab with fine SRAM ridges (educational layer) */}
      <Part definition={defOf(HW, 'cache-layer')} position={[0, LAYER_Y, 0.62]}>
        <mesh material={mat('chipLabel')} castShadow={false}>
          <boxGeometry args={[1.32, 0.03, 0.58]} />
        </mesh>
        <Instanced transforms={cacheRidges} material={mat('silicon')} castShadow={false}>
          <boxGeometry args={[1.18, 0.012, 0.018]} />
        </Instanced>
      </Part>

      {/* Solder TIM — thin light-gray slab slightly smaller than the die */}
      <Part definition={defOf(HW, 'thermal-paste')} position={[0, TIM_Y, 0]}>
        <RoundedBox args={[1.42, 0.035, 1.78]} radius={0.015} smoothness={2} material={mat('thermalPaste')} />
      </Part>

      {/* Integrated heat spreader — extruded winged lid with raised plateau */}
      <Part definition={defOf(HW, 'ihs')} position={[0, IHS_Y, 0]}>
        <Extrude args={[lidShape, lidExtrude]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow material={mat('brushedAluminum')} />
        <Extrude args={[plateauShape, plateauExtrude]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.185, 0]} castShadow material={mat('brushedAluminum')} />
        {/* Laser-etched marking block on the plateau */}
        <mesh position={[0, 0.268, -0.05]} material={mat('steel')}>
          <boxGeometry args={[1.2, 0.004, 0.5]} />
        </mesh>
        {/* Skirt walls sealing the lid to the substrate */}
        <mesh position={[-1.26, SKIRT_Y, 0]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[0.1, SKIRT_H, 1.44]} />
        </mesh>
        <mesh position={[1.26, SKIRT_Y, 0]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[0.1, SKIRT_H, 1.44]} />
        </mesh>
        <mesh position={[0, SKIRT_Y, -0.98]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[2.0, SKIRT_H, 0.07]} />
        </mesh>
        <mesh position={[0, SKIRT_Y, 0.98]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[2.0, SKIRT_H, 0.07]} />
        </mesh>
        {/* Glue feet under the mounting wings */}
        <mesh position={[0, SKIRT_Y, -1.21]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[1.36, SKIRT_H, 0.38]} />
        </mesh>
        <mesh position={[0, SKIRT_Y, 1.21]} castShadow material={mat('brushedAluminum')}>
          <boxGeometry args={[1.36, SKIRT_H, 0.38]} />
        </mesh>
      </Part>

      {/* ——— Educational animations ——— */}
      <Anim id="data-flow">
        {([
          [1.6, -1.6],
          [-1.6, -1.6],
          [1.6, 1.6],
          [-1.6, 1.6],
        ] as const).map(([x, z], i) => (
          <FlowPath
            key={i}
            points={[
              [x, 0.02, z],
              [x * 0.5, 0.12, z * 0.5],
              [0, 0.2, 0],
            ]}
            color={ORANGE}
            count={10}
            phase={i * 0.25}
          />
        ))}
        <FlowPath
          points={[
            [0, 0.2, 0.62],
            [0, 0.26, 0.1],
            [0, 0.2, -0.35],
          ]}
          color={TEAL}
          count={8}
          size={0.035}
        />
      </Anim>

      <Anim id="instruction-pipeline">
        <ActivityGrid rows={1} cols={5} cellSize={0.22} gap={0.05} mode="sequence" color={ORANGE} position={[0, 0.215, -0.35]} />
        <FlowPath
          points={[
            [-0.66, 0.215, -0.35],
            [0.66, 0.215, -0.35],
          ]}
          count={8}
          color={TEAL}
          size={0.035}
        />
      </Anim>

      <Anim id="core-activity">
        {/* 4×4 grid aligned 1:1 with the 16 core blocks */}
        <ActivityGrid rows={4} cols={4} cellSize={0.24} gap={0.05} mode="random" color={ORANGE} position={[0, 0.205, -0.35]} />
      </Anim>

      <Anim id="cache-access">
        <ActivityGrid rows={3} cols={8} cellSize={0.13} gap={0.04} mode="wave" color={TEAL} position={[0, 0.19, 0.62]} />
        <FlowPath
          points={[
            [0, 0.19, 0.62],
            [0, 0.3, 0.1],
            [0, 0.21, -0.35],
          ]}
          count={10}
          color={ORANGE}
        />
      </Anim>

      <Anim id="clock-pulse">
        <PulseRing radius={1.9} color={TEAL} position={[0, 0.56, 0]} rate={3} />
        <ActivityGrid rows={4} cols={4} cellSize={0.24} gap={0.05} mode="wave" color={ORANGE_LIGHT} position={[0, 0.205, -0.35]} />
      </Anim>

      <Anim id="thermal-flow">
        {([-0.4, 0, 0.4] as const).map((x, i) => (
          <FlowPath
            key={i}
            points={[
              [x, 0.14, -0.3],
              [x, 0.32, -0.15],
              [x, 0.5, 0],
            ]}
            color={ORANGE}
            count={6}
            size={0.03}
            phase={i * 0.33}
          />
        ))}
        <RisingParticles area={[2.2, 2.2]} height={1.4} count={56} color={ORANGE_LIGHT} position={[0, 0.54, 0]} />
      </Anim>
    </group>
  );
}
