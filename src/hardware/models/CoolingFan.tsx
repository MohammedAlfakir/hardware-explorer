'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  CatmullRomCurve3,
  Path,
  Shape,
  Vector3,
  type ExtrudeGeometryOptions,
} from 'three';
import { Part } from '@/three/Part';
import { ActivityGrid, Anim, PulseRing, RisingParticles } from '@/three/eduFx';
import { animationClock } from '@/state/animationClock';
import { useHardwareStore } from '@/state/useHardwareStore';
import type { InstanceTransform } from './common';
import { defOf, Instanced, smoothstep, Spin, useMat } from './common';

const HW = 'cooling-fan' as const;

/* ------------------------------------------------------------------ */
/* Dimensions (120 × 120 × 25 mm fan, facing +Z, bounds [3.2,3.2,1.1]) */
/* ------------------------------------------------------------------ */
const FRAME_HALF = 1.5; // outer half-width of the square frame
const FRAME_CORNER = 0.26; // rounded-corner radius of the frame silhouette
const DUCT_R = 1.36; // inner duct radius (blade-tip clearance bore)
const DUCT_WALL_R = 1.42; // outer radius of the duct barrel
const FACE_DEPTH = 0.1; // extrusion depth of each face plate
const SCREW_XY = 1.23; // corner screw-channel offset

/** Rounded square frame silhouette with the circular duct cut out. */
function makeFacePlateShape(): Shape {
  const h = FRAME_HALF;
  const r = FRAME_CORNER;
  const s = new Shape();
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.absarc(h - r, -h + r, r, -Math.PI / 2, 0, false);
  s.lineTo(h, h - r);
  s.absarc(h - r, h - r, r, 0, Math.PI / 2, false);
  s.lineTo(-h + r, h);
  s.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-h, -h + r);
  s.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  const bore = new Path();
  bore.absarc(0, 0, DUCT_R, 0, Math.PI * 2, true);
  s.holes.push(bore);
  return s;
}

/** Annulus for the duct barrel so its interior faces really exist. */
function makeDuctWallShape(): Shape {
  const s = new Shape();
  s.absarc(0, 0, DUCT_WALL_R, 0, Math.PI * 2, false);
  const bore = new Path();
  bore.absarc(0, 0, DUCT_R, 0, Math.PI * 2, true);
  s.holes.push(bore);
  return s;
}

/** Swept crescent blade planform, built along +X (root → tip). */
function makeBladeShape(): Shape {
  const s = new Shape();
  s.moveTo(0.4, 0.06);
  // Leading edge sweeping outward.
  s.quadraticCurveTo(0.72, 0.34, 1.06, 0.36);
  s.quadraticCurveTo(1.24, 0.36, 1.3, 0.22);
  // Rounded tip.
  s.quadraticCurveTo(1.35, 0.03, 1.26, -0.1);
  // Trailing edge curving back to the root.
  s.quadraticCurveTo(0.92, -0.24, 0.56, -0.18);
  s.quadraticCurveTo(0.4, -0.14, 0.4, 0.06);
  return s;
}

const FACE_EXTRUDE: ExtrudeGeometryOptions = {
  depth: FACE_DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.015,
  bevelSize: 0.015,
  bevelSegments: 2,
  curveSegments: 40,
};

const DUCT_EXTRUDE: ExtrudeGeometryOptions = {
  depth: 0.86,
  bevelEnabled: false,
  curveSegments: 48,
};

const BLADE_EXTRUDE: ExtrudeGeometryOptions = {
  depth: 0.035,
  bevelEnabled: true,
  bevelThickness: 0.012,
  bevelSize: 0.02,
  bevelSegments: 2,
  curveSegments: 16,
};

const CORNERS = [
  [-SCREW_XY, -SCREW_XY],
  [SCREW_XY, -SCREW_XY],
  [-SCREW_XY, SCREW_XY],
  [SCREW_XY, SCREW_XY],
] as const;

/**
 * Cooling Fan — 120 mm PWM case fan facing +Z. Glass-fiber frame with a
 * true circular duct cutout, nine swept blades on a glossy rotor bell,
 * BLDC stator, fluid-dynamic bearing, ARGB diffuser ring, rubber-damped
 * screw channels and a sleeved motor cable.
 */
export function CoolingFanModel() {
  const mat = useMat();

  const facePlate = useMemo(makeFacePlateShape, []);
  const ductWall = useMemo(makeDuctWallShape, []);
  const bladeShape = useMemo(makeBladeShape, []);

  const bladeAngles = useMemo(
    () => Array.from({ length: 9 }, (_, i) => (i / 9) * Math.PI * 2),
    [],
  );

  const strutAngles = useMemo(
    () => Array.from({ length: 3 }, (_, i) => Math.PI / 2 + (i / 3) * Math.PI * 2),
    [],
  );

  /** Screw channels running through all four corners. */
  const screwChannels = useMemo(
    () =>
      CORNERS.map(([x, y]): InstanceTransform => ({
        position: [x, y, 0],
        rotation: [Math.PI / 2, 0, 0],
      })),
    [],
  );

  /** Countersink rings on both faces of every corner. */
  const screwRings = useMemo(
    () =>
      CORNERS.flatMap(([x, y]): InstanceTransform[] => [
        { position: [x, y, 0.5] },
        { position: [x, y, -0.5] },
      ]),
    [],
  );

  /** Stator pole shoes fanned around the lamination stack. */
  const statorPoles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i): InstanceTransform => {
        const a = (i / 9) * Math.PI * 2;
        return {
          position: [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0],
          rotation: [0, 0, a],
        };
      }),
    [],
  );

  /** Motor cable running along the lower strut and out the corner. */
  const cableCurve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(0.14, -0.1, -0.38),
          new Vector3(0.58, -0.38, -0.42),
          new Vector3(1.04, -0.72, -0.4),
          new Vector3(1.34, -1.04, -0.3),
          new Vector3(1.44, -1.33, -0.1),
        ],
        false,
        'catmullrom',
        0.35,
      ),
    [],
  );

  /** PWM curve: ramps 15% → 100% duty across the loop. */
  const pwmModulate = () => {
    const s = useHardwareStore.getState();
    if (s.activeHardwareId !== HW || s.activeAnimationId !== 'pwm-curve') return 1;
    return 0.15 + smoothstep(animationClock.progress) * 1.6;
  };

  return (
    <group>
      {/* ——— Frame: face plates, duct barrel, pillars, pads, struts ——— */}
      <Part definition={defOf(HW, 'housing')} position={[0, 0, 0]}>
        {/* Front face plate (rounded square with circular cutout) */}
        <mesh position={[0, 0, 0.32]} castShadow receiveShadow material={mat('plasticLight')}>
          <extrudeGeometry args={[facePlate, FACE_EXTRUDE]} />
        </mesh>
        {/* Back face plate */}
        <mesh position={[0, 0, -0.42]} castShadow receiveShadow material={mat('plasticLight')}>
          <extrudeGeometry args={[facePlate, FACE_EXTRUDE]} />
        </mesh>
        {/* Duct barrel — dark interior for contrast against the light frame */}
        <mesh position={[0, 0, -0.43]} castShadow receiveShadow material={mat('plasticMatte')}>
          <extrudeGeometry args={[ductWall, DUCT_EXTRUDE]} />
        </mesh>
        {/* Corner pillars joining the two faces */}
        {CORNERS.map(([x, y], i) => (
          <RoundedBox
            key={`pillar-${i}`}
            args={[0.5, 0.5, 0.88]}
            radius={0.07}
            smoothness={3}
            position={[x, y, 0]}
            castShadow
            receiveShadow
            material={mat('plasticLight')}
          />
        ))}
        {/* Anti-vibration corner pads, both faces */}
        {CORNERS.flatMap(([x, y], i) =>
          [0.462, -0.462].map((z, j) => (
            <RoundedBox
              key={`pad-${i}-${j}`}
              args={[0.46, 0.46, 0.05]}
              radius={0.06}
              smoothness={2}
              position={[x, y, z]}
              castShadow
              material={mat('plasticMatte')}
            />
          )),
        )}
        {/* Rear support struts: duct wall → stator carrier */}
        {strutAngles.map((a, i) => (
          <group key={`strut-${i}`} rotation={[0, 0, a]}>
            <mesh
              position={[0.85, 0, -0.36]}
              rotation={[0.55, 0, 0.08]}
              castShadow
              material={mat('plasticLight')}
            >
              <boxGeometry args={[1.1, 0.075, 0.13]} />
            </mesh>
          </group>
        ))}
        {/* Rubber motor cable exiting along the lower strut */}
        <mesh castShadow material={mat('plasticMatte')}>
          <tubeGeometry args={[cableCurve, 48, 0.034, 8, false]} />
        </mesh>
        {/* 4-pin PWM connector at the cable end */}
        <mesh position={[1.44, -1.41, -0.1]} rotation={[0, 0, 0.08]} castShadow material={mat('pcbBlack')}>
          <boxGeometry args={[0.1, 0.17, 0.08]} />
        </mesh>
      </Part>

      {/* ——— ARGB diffuser ring inset just inside the front rim ——— */}
      <Part definition={defOf(HW, 'rgb-ring')} position={[0, 0, 0.4]}>
        {/* Recessed mounting channel */}
        <mesh position={[0, 0, -0.045]} material={mat('darkMetal')}>
          <torusGeometry args={[1.3, 0.062, 12, 80]} />
        </mesh>
        {/* Diffuser light ring */}
        <mesh material={mat('rgbRing')}>
          <torusGeometry args={[1.3, 0.048, 16, 96]} />
        </mesh>
      </Part>

      {/* ——— Rotor: nine swept blades + glossy hub bell (spins) ——— */}
      <Part definition={defOf(HW, 'blades')} position={[0, 0, 0.04]}>
        <Spin axis="z" speed={-9} modulate={pwmModulate}>
          {/* Hub bell */}
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat('plasticGloss')}>
            <cylinderGeometry args={[0.46, 0.46, 0.4, 40]} />
          </mesh>
          {/* Rounded shoulder */}
          <mesh position={[0, 0, 0.28]} material={mat('plasticGloss')}>
            <torusGeometry args={[0.4, 0.06, 12, 40]} />
          </mesh>
          {/* Flat cap */}
          <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat('plasticGloss')}>
            <cylinderGeometry args={[0.4, 0.4, 0.05, 40]} />
          </mesh>
          {/* Brushed center disc */}
          <mesh position={[0, 0, 0.327]} rotation={[Math.PI / 2, 0, 0]} material={mat('brushedAluminum')}>
            <cylinderGeometry args={[0.29, 0.29, 0.012, 36]} />
          </mesh>
          {/* Nine swept blades: placement spin around Z, pitch about the radial axis */}
          {bladeAngles.map((a, i) => (
            <group key={`blade-${i}`} rotation={[0, 0, a]}>
              <mesh
                position={[0, 0, -0.03]}
                rotation={[0.52, 0, 0]}
                castShadow
                receiveShadow
                material={mat('fanBladeLight')}
              >
                <extrudeGeometry args={[bladeShape, BLADE_EXTRUDE]} />
              </mesh>
            </group>
          ))}
        </Spin>
      </Part>

      {/* ——— BLDC motor: lamination stack, coils, driver PCB ——— */}
      <Part definition={defOf(HW, 'motor-hub')} position={[0, 0, -0.16]}>
        {/* Stator lamination stack */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={mat('darkMetal')}>
          <cylinderGeometry args={[0.34, 0.34, 0.16, 32]} />
        </mesh>
        {/* Pole shoes */}
        <Instanced transforms={statorPoles} material={mat('darkMetal')}>
          <boxGeometry args={[0.12, 0.07, 0.17]} />
        </Instanced>
        {/* Copper winding ring */}
        <mesh position={[0, 0, -0.02]} material={mat('copper')}>
          <torusGeometry args={[0.25, 0.08, 12, 40]} />
        </mesh>
        {/* Bearing tube carrier */}
        <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={mat('plasticGloss')}>
          <cylinderGeometry args={[0.16, 0.16, 0.24, 24]} />
        </mesh>
        {/* Motor driver PCB */}
        <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]} castShadow material={mat('pcbBlack')}>
          <cylinderGeometry args={[0.37, 0.37, 0.028, 36]} />
        </mesh>
      </Part>

      {/* ——— Fluid-dynamic bearing: shaft in an oil-filled sleeve ——— */}
      <Part definition={defOf(HW, 'bearing')} position={[0, 0, 0]}>
        {/* Rotor shaft */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('steel')}>
          <cylinderGeometry args={[0.045, 0.045, 0.62, 20]} />
        </mesh>
        {/* Bearing sleeve */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} material={mat('darkMetal')}>
          <cylinderGeometry args={[0.085, 0.085, 0.36, 20]} />
        </mesh>
        {/* Thrust washer */}
        <mesh position={[0, 0, 0.12]} material={mat('copper')}>
          <torusGeometry args={[0.068, 0.016, 8, 20]} />
        </mesh>
        {/* Retaining C-clip */}
        <mesh position={[0, 0, -0.26]} material={mat('steel')}>
          <torusGeometry args={[0.072, 0.018, 8, 20]} />
        </mesh>
      </Part>

      {/* ——— Screw channels through the four corners ——— */}
      <Part definition={defOf(HW, 'mounting-points')} position={[0, 0, 0]}>
        <Instanced transforms={screwChannels} material={mat('steel')}>
          <cylinderGeometry args={[0.05, 0.05, 0.94, 16]} />
        </Instanced>
        <Instanced transforms={screwRings} material={mat('steel')}>
          <torusGeometry args={[0.1, 0.026, 10, 28]} />
        </Instanced>
      </Part>

      {/* ——— Educational animations ——— */}
      <Anim id="airflow">
        {/* Intake stream pulled toward the rear of the fan */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.55]}>
          <RisingParticles area={[2.4, 2.4]} height={1.25} count={46} color="#0fa48e" size={0.024} swirl={0.5} />
        </group>
        {/* Swirling exhaust driven out through the duct */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <RisingParticles area={[1.7, 1.7]} height={1.7} count={90} color="#f6821f" size={0.026} swirl={2.6} />
          <RisingParticles area={[1.0, 1.0]} height={1.9} count={40} color="#ffb25e" size={0.022} swirl={3.4} />
        </group>
      </Anim>

      <Anim id="pwm-curve">
        {/* Duty-cycle pulse radiating from the hub as the rotor ramps up */}
        <PulseRing radius={0.55} color="#f6821f" position={[0, 0, 0.52]} rotation={[0, 0, 0]} rate={3} />
        {/* Airflow intensity tracks the ramping rotor */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <RisingParticles area={[1.5, 1.5]} height={1.5} count={44} color="#ffb25e" size={0.022} swirl={2.0} />
        </group>
        {/* Duty-cycle indicator bar along the lower edge */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, -1.5, 0.52]}>
          <ActivityGrid rows={1} cols={9} cellSize={0.14} gap={0.05} height={0.05} color="#0fa48e" mode="wave" />
        </group>
      </Anim>
    </group>
  );
}
