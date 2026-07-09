'use client';

import { useMemo } from 'react';
import {
  CanvasTexture,
  CatmullRomCurve3,
  MeshStandardMaterial,
  Path,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { RoundedBox } from '@react-three/drei';
import { Part } from '@/three/Part';
import { ActivityGrid, Anim, FlowPath } from '@/three/eduFx';
import type { InstanceTransform } from './common';
import { defOf, Instanced, Spin, useMat } from './common';

const HW = 'gpu' as const;

/* ------------------------------------------------------------ constants */

const CARD_LENGTH = 6.4; // X
const CARD_DEPTH = 2.9; // Z
const FAN_X = 1.62; // fan centers at ±FAN_X
const FAN_R = 1.06; // shroud cutout radius
const SHROUD_TOP = 0.72;

const FX = { orange: '#f6821f', amber: '#ffb25e', teal: '#0fa48e' } as const;

/* ------------------------------------------------------------ geometry */

/** Rounded rectangle outline (in the shape's XY plane). */
function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Shroud top plate: rounded slab with two true circular fan cutouts. */
function useShroudPlate() {
  return useMemo(() => {
    const shape = roundedRect(CARD_LENGTH, CARD_DEPTH, 0.34);
    for (const cx of [-FAN_X, FAN_X]) {
      const hole = new Path();
      hole.absarc(cx, 0, FAN_R, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    return shape;
  }, []);
}

/** Shroud skirt: the wrap-around side wall (frame with hollow interior). */
function useShroudSkirt() {
  return useMemo(() => {
    const outer = roundedRect(CARD_LENGTH, CARD_DEPTH, 0.34);
    const inner = roundedRect(CARD_LENGTH - 0.24, CARD_DEPTH - 0.24, 0.26);
    outer.holes.push(inner);
    return outer;
  }, []);
}

/** Single swept fan blade planform (extruded, then pitched per instance). */
function useBladeShape() {
  return useMemo(() => {
    // Wide, strongly swept blade so 11 of them visually overlap like a real
    // ring fan. Radial extent 0.26 → 0.95.
    const s = new Shape();
    s.moveTo(0.26, 0.1);
    s.bezierCurveTo(0.5, 0.34, 0.72, 0.42, 0.95, 0.4);
    s.bezierCurveTo(0.99, 0.2, 0.99, -0.02, 0.95, -0.18);
    s.bezierCurveTo(0.7, -0.34, 0.44, -0.32, 0.28, -0.2);
    s.bezierCurveTo(0.22, -0.08, 0.22, 0.02, 0.26, 0.1);
    return s;
  }, []);
}

/** Thin annulus for the fan's connected rim (solid, correctly walled). */
function useRimShape() {
  return useMemo(() => {
    const s = new Shape();
    s.absarc(0, 0, 1.0, 0, Math.PI * 2, false);
    const hole = new Path();
    hole.absarc(0, 0, 0.955, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }, []);
}

/** "HL" hub sticker — dark disc, orange ring + monogram (canvas texture). */
function useHubSticker() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#17181a';
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f6821f';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f6821f';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HL', 128, 134);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return new MeshStandardMaterial({
      map: tex,
      metalness: 0.2,
      roughness: 0.4,
      envMapIntensity: 0.7,
    });
  }, []);
}

/** Perforated I/O bracket plate (holes punched in the real outline). */
function useBracketShape() {
  return useMemo(() => {
    // Built in shape-XY: x → world Z (card depth), y → world Y (height).
    const w = 2.72;
    const h = 1.18;
    const shape = roundedRect(w, h, 0.06);
    // Vent hole grid (upper 2/3).
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const x = -w / 2 + 0.24 + col * 0.205 + (row % 2) * 0.1;
        const y = h / 2 - 0.16 - row * 0.155;
        if (x > w / 2 - 0.18) continue;
        const hole = new Path();
        hole.absarc(x, y, 0.052, 0, Math.PI * 2, true);
        shape.holes.push(hole);
      }
    }
    // Display outputs along the lower edge: 3× DP + 1× HDMI.
    const ports = [-0.95, -0.35, 0.25, 0.85];
    ports.forEach((cx, i) => {
      const hole = new Path();
      const pw = i === 3 ? 0.42 : 0.46;
      const ph = 0.13;
      hole.moveTo(cx - pw / 2, -h / 2 + 0.14);
      hole.lineTo(cx + pw / 2, -h / 2 + 0.14);
      hole.lineTo(cx + pw / 2, -h / 2 + 0.14 + ph);
      hole.lineTo(cx - pw / 2, -h / 2 + 0.14 + ph);
      hole.closePath();
      shape.holes.push(hole);
    });
    return shape;
  }, []);
}

/* ---------------------------------------------------------------- fans */

function FanRotor({
  bladeMaterial,
  hubMaterial,
  stickerMaterial,
}: {
  bladeMaterial: import('three').Material;
  hubMaterial: import('three').Material;
  stickerMaterial: import('three').Material;
}) {
  const blade = useBladeShape();
  const rim = useRimShape();
  const blades = useMemo(() => Array.from({ length: 11 }, (_, i) => (i / 11) * Math.PI * 2), []);

  return (
    <group>
      {/* Hub */}
      <mesh castShadow material={hubMaterial}>
        <cylinderGeometry args={[0.31, 0.34, 0.2, 48]} />
      </mesh>
      {/* Hub sticker */}
      <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]} material={stickerMaterial}>
        <circleGeometry args={[0.26, 48]} />
      </mesh>
      {/* Blades */}
      {blades.map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh
            castShadow
            rotation={[-Math.PI / 2 + 0.4, 0, 0]}
            material={bladeMaterial}
          >
            <extrudeGeometry
              args={[blade, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 }]}
            />
          </mesh>
        </group>
      ))}
      {/* Connected outer rim ring (signature ring-fan look) */}
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} material={bladeMaterial}>
        <extrudeGeometry args={[rim, { depth: 0.16, bevelEnabled: false, curveSegments: 64 }]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- model */

/**
 * GPU — dual-axial graphics card in the reference "HL" style: light die-cast
 * shroud with true circular fan wells, aluminum fin stack, copper vapor
 * chamber + heat pipes, black 14-layer PCB, perforated I/O bracket.
 */
export function GpuModel() {
  const mat = useMat();
  const shroudPlate = useShroudPlate();
  const shroudSkirt = useShroudSkirt();
  const bracket = useBracketShape();
  const sticker = useHubSticker();

  const fins = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 46; i++) {
      out.push({ position: [-2.82 + i * 0.1255, 0, 0] });
    }
    return out;
  }, []);

  const vramChips = useMemo(() => {
    const ring: Array<[number, number]> = [
      [-0.85, -0.78], [0, -0.82], [0.85, -0.78],
      [-0.85, 0.78], [0, 0.82], [0.85, 0.78],
      [-1.05, 0], [1.05, 0],
    ];
    return ring.map(([x, z]) => ({ position: [x, 0, z] as [number, number, number] }));
  }, []);

  const mosfets = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 14; i++) {
      out.push({ position: [1.85 + (i % 2) * 0.26, 0, -1.0 + Math.floor(i / 2) * 0.3] });
    }
    return out;
  }, []);

  const capacitors = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 10; i++) out.push({ position: [2.5, 0.03, -1.05 + i * 0.23] });
    for (let i = 0; i < 5; i++) out.push({ position: [0, 0.03, -1.15 + i * 0.14] });
    return out;
  }, []);

  const passives = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 60; i++) {
      const gx = Math.sin(i * 12.9898) * 43758.5453;
      const gz = Math.sin(i * 78.233) * 12543.2341;
      out.push({
        position: [
          -2.6 + ((gx - Math.floor(gx)) % 1) * 5.2,
          0,
          -1.15 + ((gz - Math.floor(gz)) % 1) * 2.3,
        ],
        rotation: [0, (i % 2) * Math.PI * 0.5, 0],
      });
    }
    return out;
  }, []);

  const heatpipeCurves = useMemo(
    () =>
      [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map(
        (z) =>
          new CatmullRomCurve3(
            [
              new Vector3(-2.85, 0.02, z),
              new Vector3(-1.4, 0.06, z),
              new Vector3(0, -0.04, z * 0.8),
              new Vector3(1.4, 0.06, z),
              new Vector3(2.85, 0.02, z),
            ],
            false,
            'catmullrom',
            0.6,
          ),
      ),
    [],
  );

  const backplateVents = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 9; i++) {
      out.push({ position: [2.35 + (i % 3) * 0.28, 0.005, -0.85 + Math.floor(i / 3) * 0.85] });
    }
    return out;
  }, []);

  const screws = useMemo(() => {
    const spots: Array<[number, number]> = [
      [-2.95, -1.2], [-2.95, 1.2], [2.95, -1.2], [2.95, 1.2], [0, -1.25], [0, 1.25],
    ];
    return spots.map(([x, z]) => ({ position: [x, 0, z] as [number, number, number] }));
  }, []);

  // PCIe x16 fingers: plated on BOTH faces of the edge tab — a short power
  // segment toward the bracket, the key notch, then the main segment.
  const pcieFingers = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (const y of [0.041, -0.041]) {
      for (let i = 0; i < 7; i++) out.push({ position: [-2.66 + i * 0.063, y, 0] });
      for (let i = 0; i < 25; i++) out.push({ position: [-2.06 + i * 0.066, y, 0] });
    }
    return out;
  }, []);

  const powerPins = useMemo(() => {
    const out: InstanceTransform[] = [];
    for (let i = 0; i < 12; i++) {
      out.push({ position: [-0.22 + (i % 6) * 0.088, 0.1, -0.075 + Math.floor(i / 6) * 0.15] });
    }
    return out;
  }, []);

  return (
    <group>
      {/* ——— Backplate ——— */}
      <Part definition={defOf(HW, 'backplate')} position={[0, -0.38, 0]}>
        <RoundedBox args={[CARD_LENGTH, 0.055, CARD_DEPTH]} radius={0.026} smoothness={2} castShadow receiveShadow material={mat('shroudLight')} />
        {/* Flow-through vent slots */}
        <Instanced transforms={backplateVents} material={mat('darkMetal')} castShadow={false}>
          <boxGeometry args={[0.2, 0.06, 0.62]} />
        </Instanced>
        {/* Screws */}
        <Instanced transforms={screws} material={mat('steel')} castShadow={false}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 12]} />
        </Instanced>
        {/* Brand strip */}
        <mesh position={[-2.2, -0.032, 0.9]} material={mat('darkMetal')}>
          <boxGeometry args={[1.0, 0.012, 0.22]} />
        </mesh>
      </Part>

      {/* ——— PCB ——— */}
      <Part definition={defOf(HW, 'pcb')} position={[0, -0.24, 0]}>
        <RoundedBox args={[6.15, 0.09, 2.78]} radius={0.03} smoothness={2} castShadow receiveShadow material={mat('pcbBlack')} />
        {/* SMD passives garnish */}
        <Instanced transforms={passives} material={mat('chipSilk')} castShadow={false}>
          <boxGeometry args={[0.06, 0.02, 0.03]} />
        </Instanced>

        {/* I/O bracket (rides with the PCB) */}
        <group position={[-3.22, 0.32, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow material={mat('steel')}>
            <extrudeGeometry args={[bracket, { depth: 0.04, bevelEnabled: false }]} />
          </mesh>
          {/* Folded mounting tab */}
          <mesh position={[-1.28, 0.66, 0.02]} material={mat('steel')}>
            <boxGeometry args={[0.16, 0.05, 0.3]} />
          </mesh>
        </group>
        {/* Port bodies behind the bracket slots */}
        {[-0.95, -0.35, 0.25].map((z) => (
          <mesh key={z} position={[-3.02, -0.12, z]} material={mat('darkMetal')}>
            <boxGeometry args={[0.42, 0.13, 0.44]} />
          </mesh>
        ))}
        <mesh position={[-3.02, -0.12, 0.85]} material={mat('darkMetal')}>
          <boxGeometry args={[0.42, 0.13, 0.4]} />
        </mesh>
      </Part>

      {/* ——— PCIe edge connector — a tab in the PCB's own plane ——— */}
      <Part definition={defOf(HW, 'pcie-connector')} position={[0, -0.24, 1.5]}>
        {/* Tab segments either side of the x16 key notch */}
        <mesh position={[-2.44, 0, 0]} castShadow material={mat('pcbBlack')}>
          <boxGeometry args={[0.52, 0.075, 0.3]} />
        </mesh>
        <mesh position={[-1.26, 0, 0]} castShadow material={mat('pcbBlack')}>
          <boxGeometry args={[1.72, 0.075, 0.3]} />
        </mesh>
        {/* Gold fingers on both faces */}
        <Instanced transforms={pcieFingers} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.042, 0.012, 0.24]} />
        </Instanced>
      </Part>

      {/* ——— GPU die on package ——— */}
      <Part definition={defOf(HW, 'gpu-die')} position={[0, -0.15, 0]}>
        <mesh material={mat('pcbGreen')}>
          <boxGeometry args={[1.3, 0.05, 1.3]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow material={mat('silicon')}>
          <boxGeometry args={[0.88, 0.06, 0.88]} />
        </mesh>
      </Part>

      {/* ——— GDDR6 packages ——— */}
      <Part definition={defOf(HW, 'vram')} position={[0, -0.15, 0]}>
        <Instanced transforms={vramChips} material={mat('chipLabel')}>
          <boxGeometry args={[0.45, 0.055, 0.34]} />
        </Instanced>
      </Part>

      {/* ——— VRM power stages ——— */}
      <Part definition={defOf(HW, 'mosfets')} position={[0, -0.15, 0]}>
        <Instanced transforms={mosfets} material={mat('chipSilk')}>
          <boxGeometry args={[0.18, 0.055, 0.24]} />
        </Instanced>
      </Part>

      {/* ——— Polymer capacitors ——— */}
      <Part definition={defOf(HW, 'capacitors')} position={[0, -0.15, 0]}>
        <Instanced transforms={capacitors} material={mat('darkMetal')}>
          <cylinderGeometry args={[0.07, 0.07, 0.11, 14]} />
        </Instanced>
      </Part>

      {/* ——— 16-pin power connector ——— */}
      <Part definition={defOf(HW, 'power-connector')} position={[2.45, 0.62, -1.08]}>
        <mesh castShadow material={mat('plasticMatte')}>
          <boxGeometry args={[0.62, 0.34, 0.38]} />
        </mesh>
        <Instanced transforms={powerPins} material={mat('goldContact')} castShadow={false}>
          <boxGeometry args={[0.04, 0.14, 0.04]} />
        </Instanced>
        {/* 4 sense pins */}
        <Instanced
          transforms={Array.from({ length: 4 }, (_, i) => ({
            position: [-0.13 + i * 0.088, 0.1, 0.14] as [number, number, number],
          }))}
          material={mat('goldContact')}
          castShadow={false}
        >
          <boxGeometry args={[0.03, 0.1, 0.03]} />
        </Instanced>
      </Part>

      {/* ——— Vapor chamber ——— */}
      <Part definition={defOf(HW, 'vapor-chamber')} position={[0, -0.05, 0]}>
        <RoundedBox args={[3.7, 0.08, 2.45]} radius={0.04} smoothness={2} castShadow material={mat('copper')} />
      </Part>

      {/* ——— Heat pipes ——— */}
      <Part definition={defOf(HW, 'heatpipes')} position={[0, 0.06, 0]}>
        {heatpipeCurves.map((curve, i) => (
          <mesh key={i} castShadow material={mat('copper')}>
            <tubeGeometry args={[curve, 40, 0.052, 12, false]} />
          </mesh>
        ))}
      </Part>

      {/* ——— Fin-stack heatsink ——— */}
      <Part definition={defOf(HW, 'heatsink')} position={[0, 0.35, 0]}>
        <Instanced transforms={fins} material={mat('brushedAluminum')} castShadow={false}>
          <boxGeometry args={[0.024, 0.54, 2.58]} />
        </Instanced>
      </Part>

      {/* ——— Shroud ——— */}
      <Part definition={defOf(HW, 'shroud')} position={[0, SHROUD_TOP, 0]}>
        {/* Top plate with true fan cutouts */}
        <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={mat('shroudLight')}>
          <extrudeGeometry
            args={[shroudPlate, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 3 }]}
          />
        </mesh>
        {/* Wrap-around skirt */}
        <mesh castShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} material={mat('shroudLight')}>
          <extrudeGeometry args={[shroudSkirt, { depth: 0.52, bevelEnabled: false }]} />
        </mesh>
        {/* Dark fan wells */}
        {[-FAN_X, FAN_X].map((x) => (
          <mesh key={x} position={[x, -0.2, 0]} material={mat('plasticMatte')}>
            <cylinderGeometry args={[FAN_R + 0.01, FAN_R + 0.01, 0.42, 48, 1, true]} />
          </mesh>
        ))}
        {/* Fan rim rings */}
        {[-FAN_X, FAN_X].map((x) => (
          <mesh key={`ring${x}`} position={[x, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('anodizedAluminum')}>
            <torusGeometry args={[FAN_R, 0.028, 10, 56]} />
          </mesh>
        ))}
        {/* Accent line on the front edge */}
        <mesh position={[0, 0.02, 1.44]} material={mat('rgbRing')}>
          <boxGeometry args={[2.2, 0.03, 0.018]} />
        </mesh>
      </Part>

      {/* ——— Fans ——— */}
      <Part definition={defOf(HW, 'fan-1')} position={[-FAN_X, 0.6, 0]}>
        <Spin axis="y" speed={7}>
          <FanRotor
            bladeMaterial={mat('fanBladeLight')}
            hubMaterial={mat('plasticGloss')}
            stickerMaterial={sticker ?? mat('plasticGloss')}
          />
        </Spin>
      </Part>
      <Part definition={defOf(HW, 'fan-2')} position={[FAN_X, 0.6, 0]}>
        <Spin axis="y" speed={-7}>
          <FanRotor
            bladeMaterial={mat('fanBladeLight')}
            hubMaterial={mat('plasticGloss')}
            stickerMaterial={sticker ?? mat('plasticGloss')}
          />
        </Spin>
      </Part>

      {/* ——— Educational animations ——— */}
      <Anim id="rendering-pipeline">
        <FlowPath
          points={[
            [-1.3, -0.24, 1.55],
            [-0.8, -0.1, 0.6],
            [0, 0.0, 0],
            [0.9, 0.0, -0.4],
            [2.45, 0.35, -1.05],
          ]}
          count={18}
          color={FX.orange}
        />
        <ActivityGrid rows={3} cols={3} cellSize={0.22} gap={0.06} mode="sequence" color={FX.amber} position={[0, 0.02, 0]} />
      </Anim>

      <Anim id="memory-transfer">
        {([
          [-0.85, -0.78], [0.85, -0.78], [-0.85, 0.78], [0.85, 0.78], [-1.05, 0], [1.05, 0],
        ] as const).map(([x, z], i) => (
          <FlowPath
            key={i}
            points={[
              [x, -0.05, z],
              [x * 0.4, 0.05, z * 0.4],
              [0, 0.0, 0],
            ]}
            count={7}
            size={0.035}
            color={i % 2 ? FX.teal : FX.orange}
            direction={i % 2 ? -1 : 1}
            phase={i * 0.17}
          />
        ))}
      </Anim>

      <Anim id="shader-execution">
        <ActivityGrid rows={5} cols={5} cellSize={0.15} gap={0.045} mode="random" color={FX.orange} position={[0, 0.02, 0]} />
      </Anim>
    </group>
  );
}
