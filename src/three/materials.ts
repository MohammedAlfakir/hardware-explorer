'use client';

import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import type { MaterialKey, MaterialVariant } from '@/hardware/types';
import { sectionPlanes } from './explodeState';

/**
 * Material Manager — a physically-based material library. Base materials are
 * cached; every Part clones what it needs so per-part view modes (x-ray,
 * wireframe, highlight) never leak across parts.
 */

/* ---------------------------------- procedural textures ---------------- */

function makeCanvas(size: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

let pcbTraceTex: CanvasTexture | null = null;
function getPcbTraceTexture() {
  if (pcbTraceTex) return pcbTraceTex;
  pcbTraceTex = makeCanvas(512, (ctx) => {
    ctx.fillStyle = '#0d3524';
    ctx.fillRect(0, 0, 512, 512);
    // Copper trace network under the solder mask.
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 20 + Math.random() * 120;
      const horizontal = Math.random() > 0.5;
      ctx.strokeStyle = `rgba(38, 96, 66, ${0.35 + Math.random() * 0.4})`;
      ctx.lineWidth = 1 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (horizontal) {
        ctx.lineTo(x + len * 0.6, y);
        ctx.lineTo(x + len * 0.6 + len * 0.3, y + (Math.random() > 0.5 ? len * 0.3 : -len * 0.3));
      } else {
        ctx.lineTo(x, y + len * 0.6);
        ctx.lineTo(x + (Math.random() > 0.5 ? len * 0.3 : -len * 0.3), y + len * 0.9);
      }
      ctx.stroke();
    }
    // Via dots.
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(20, 60, 42, ${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  pcbTraceTex.colorSpace = SRGBColorSpace;
  return pcbTraceTex;
}

let brushedTex: CanvasTexture | null = null;
function getBrushedRoughness() {
  if (brushedTex) return brushedTex;
  brushedTex = makeCanvas(256, (ctx) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * 256;
      const v = 100 + Math.floor(Math.random() * 90);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
  });
  return brushedTex;
}

/* ---------------------------------- material recipes ------------------- */

type Recipe = () => MeshStandardMaterial;

const RECIPES: Record<MaterialKey, Recipe> = {
  brushedAluminum: () =>
    new MeshPhysicalMaterial({
      color: new Color('#c8ccd4'),
      metalness: 1,
      roughness: 0.42,
      roughnessMap: getBrushedRoughness(),
      envMapIntensity: 1.1,
    }),
  anodizedAluminum: () =>
    new MeshPhysicalMaterial({
      color: new Color('#5c6375'),
      metalness: 0.7,
      roughness: 0.42,
      roughnessMap: getBrushedRoughness(),
      envMapIntensity: 1.3,
    }),
  paintedMetal: () =>
    new MeshPhysicalMaterial({
      color: new Color('#2a2d33'),
      metalness: 0.35,
      roughness: 0.55,
      clearcoat: 0.4,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.8,
    }),
  shroudLight: () =>
    new MeshPhysicalMaterial({
      color: new Color('#c4c4c1'),
      metalness: 0.55,
      roughness: 0.48,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.9,
    }),
  copper: () =>
    new MeshPhysicalMaterial({
      color: new Color('#c97a45'),
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 1.2,
    }),
  silicon: () =>
    new MeshPhysicalMaterial({
      color: new Color('#454d5e'),
      metalness: 0.75,
      roughness: 0.22,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.1,
      iridescence: 0.55,
      iridescenceIOR: 1.6,
    }),
  plasticMatte: () =>
    new MeshStandardMaterial({
      color: new Color('#2a2f39'),
      metalness: 0.05,
      roughness: 0.85,
      envMapIntensity: 0.5,
    }),
  plasticGloss: () =>
    new MeshPhysicalMaterial({
      color: new Color('#21252e'),
      metalness: 0.05,
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.8,
    }),
  plasticLight: () =>
    new MeshStandardMaterial({
      color: new Color('#d8d8d4'),
      metalness: 0.04,
      roughness: 0.62,
      envMapIntensity: 0.65,
    }),
  glass: () =>
    new MeshPhysicalMaterial({
      color: new Color('#9fb4d8'),
      metalness: 0,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 0.4,
      ior: 1.5,
      transparent: true,
      envMapIntensity: 1.2,
    }),
  pcbGreen: () =>
    new MeshStandardMaterial({
      color: new Color('#ffffff'),
      map: getPcbTraceTexture(),
      metalness: 0.25,
      roughness: 0.42,
      envMapIntensity: 0.7,
    }),
  pcbBlack: () =>
    new MeshStandardMaterial({
      color: new Color('#1c2029'),
      metalness: 0.3,
      roughness: 0.45,
      envMapIntensity: 0.7,
    }),
  goldContact: () =>
    new MeshPhysicalMaterial({
      color: new Color('#e8b64a'),
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 1.3,
    }),
  thermalPaste: () =>
    new MeshStandardMaterial({
      color: new Color('#b9bfc9'),
      metalness: 0.2,
      roughness: 0.9,
      envMapIntensity: 0.4,
    }),
  steel: () =>
    new MeshPhysicalMaterial({
      color: new Color('#8f96a3'),
      metalness: 1,
      roughness: 0.35,
      envMapIntensity: 1.0,
    }),
  darkMetal: () =>
    new MeshPhysicalMaterial({
      color: new Color('#333947'),
      metalness: 0.85,
      roughness: 0.4,
      envMapIntensity: 0.9,
    }),
  fanBlade: () =>
    new MeshPhysicalMaterial({
      color: new Color('#3a3d43'),
      metalness: 0.1,
      roughness: 0.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.9,
    }),
  fanBladeLight: () =>
    new MeshPhysicalMaterial({
      color: new Color('#dddddb'),
      metalness: 0.06,
      roughness: 0.45,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.8,
    }),
  rgbRing: () =>
    new MeshStandardMaterial({
      color: new Color('#14100c'),
      emissive: new Color('#f6821f'),
      emissiveIntensity: 1.5,
      metalness: 0,
      roughness: 0.4,
    }),
  chipLabel: () =>
    new MeshStandardMaterial({
      color: new Color('#1e2126'),
      metalness: 0.4,
      roughness: 0.35,
      envMapIntensity: 0.9,
    }),
  chipSilk: () =>
    new MeshStandardMaterial({
      color: new Color('#33363c'),
      metalness: 0.3,
      roughness: 0.5,
      envMapIntensity: 0.7,
    }),
};

/** Variant adjustments applied on top of the base recipe. */
function applyVariant(mat: MeshStandardMaterial, key: MaterialKey, variant: MaterialVariant) {
  if (variant === 'polished') {
    if (mat.metalness > 0.5) {
      mat.roughness = Math.max(0.06, mat.roughness - 0.22);
      mat.envMapIntensity = (mat.envMapIntensity ?? 1) + 0.3;
    }
  } else if (variant === 'stealth') {
    if (key === 'brushedAluminum' || key === 'steel') mat.color.set('#4a4f59');
    if (key === 'paintedMetal' || key === 'plasticGloss') mat.color.set('#101218');
    if (key === 'copper') mat.color.set('#8a5a3a');
    mat.roughness = Math.min(1, mat.roughness + 0.15);
    if ('clearcoat' in mat) (mat as MeshPhysicalMaterial).clearcoat = 0;
  }
}

const cache = new Map<string, MeshStandardMaterial>();

/** Shared base material (do not mutate — clone via clonePartMaterial). */
export function getBaseMaterial(key: MaterialKey, variant: MaterialVariant = 'factory') {
  const cacheKey = `${key}:${variant}`;
  let mat = cache.get(cacheKey);
  if (!mat) {
    mat = RECIPES[key]();
    applyVariant(mat, key, variant);
    mat.clippingPlanes = sectionPlanes;
    mat.clipShadows = true;
    mat.userData.materialKey = key;
    cache.set(cacheKey, mat);
  }
  return mat;
}

/** Per-part clone that keeps the shared section-plane array reference. */
export function clonePartMaterial(source: MeshStandardMaterial) {
  const clone = source.clone();
  clone.clippingPlanes = sectionPlanes;
  clone.clipShadows = true;
  clone.userData.materialKey = source.userData.materialKey;
  return clone;
}
