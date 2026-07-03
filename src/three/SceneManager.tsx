'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  Html,
  PerformanceMonitor,
} from '@react-three/drei';
import gsap from 'gsap';
import { Group } from 'three';
import { HARDWARE } from '@/hardware/registry';
import { useHardwareStore } from '@/state/useHardwareStore';
import { color as tokens, motion } from '@/design/tokens';
import { CpuModel } from '@/hardware/models/Cpu';
import { GpuModel } from '@/hardware/models/Gpu';
import { RamModel } from '@/hardware/models/Ram';
import { SsdModel } from '@/hardware/models/Ssd';
import { MotherboardModel } from '@/hardware/models/Motherboard';
import { CoolingFanModel } from '@/hardware/models/CoolingFan';
import { CameraManager } from './CameraManager';
import { Lighting } from './Lighting';
import { PostFX } from './PostFX';
import { LabelLayer } from './Labels';
import { MeasureTool } from './MeasureTool';
import { ClockDriver, ExplodeController, SectionController } from './controllers';

const MODELS = {
  cpu: CpuModel,
  gpu: GpuModel,
  ram: RamModel,
  ssd: SsdModel,
  motherboard: MotherboardModel,
  'cooling-fan': CoolingFanModel,
} as const;

/**
 * Model Manager — hosts the active hardware model and animates the swap:
 * a quick GSAP outro while the store waits, then an intro for the incoming
 * assembly. Remounts on material-variant change so clones pick up finishes.
 */
function ModelHost() {
  const hardwareId = useHardwareStore((s) => s.activeHardwareId);
  const variant = useHardwareStore((s) => s.materialVariant);
  const transitioning = useHardwareStore((s) => s.modelTransitioning);
  const group = useRef<Group>(null!);
  const Model = MODELS[hardwareId];

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    if (transitioning) {
      gsap.to(g.scale, { x: 0.82, y: 0.82, z: 0.82, duration: 0.24, ease: 'power2.in' });
      gsap.to(g.rotation, { y: 0.35, duration: 0.24, ease: 'power2.in' });
    } else {
      gsap.fromTo(
        g.scale,
        { x: 0.82, y: 0.82, z: 0.82 },
        { x: 1, y: 1, z: 1, duration: motion.duration.slow, ease: motion.ease.gsapOut },
      );
      gsap.fromTo(
        g.rotation,
        { y: -0.5 },
        { y: 0, duration: motion.duration.slow, ease: motion.ease.gsapOut },
      );
      gsap.fromTo(
        g.position,
        { y: -0.3 },
        { y: 0, duration: motion.duration.slow, ease: motion.ease.gsapOut },
      );
    }
  }, [transitioning, hardwareId]);

  return (
    <group ref={group}>
      <Model key={`${hardwareId}:${variant}`} />
    </group>
  );
}

function Ground() {
  const hardwareId = useHardwareStore((s) => s.activeHardwareId);
  const bounds = HARDWARE[hardwareId].bounds;
  const y = -bounds[1] / 2 - 0.55;
  return (
    <ContactShadows
      position={[0, y + 0.01, 0]}
      opacity={0.42}
      scale={18}
      blur={2.4}
      far={4.5}
      resolution={512}
      frames={Infinity}
      color="#3a3632"
    />
  );
}

function Loader() {
  return (
    <Html center>
      <div
        role="status"
        aria-label="Loading 3D scene"
        style={{
          width: 34,
          height: 34,
          border: `2px solid ${tokens.surface3}`,
          borderTopColor: tokens.accent,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </Html>
  );
}

/**
 * Scene Manager — the root Canvas: color management, shadows, adaptive
 * performance scaling and the full system stack.
 */
export function SceneManager() {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      onPointerMissed={() => {
        const s = useHardwareStore.getState();
        if (!s.measureMode) s.clearSelection();
      }}
      className="!absolute inset-0"
      aria-label="Interactive 3D hardware viewer"
      role="img"
    >
      <PerformanceMonitor
        onDecline={() => setDpr([1, 1.25])}
        onIncline={() => setDpr([1, 2])}
      >
        <Suspense fallback={<Loader />}>
          <CameraManager />
          <Lighting />
          <ModelHost />
          <Ground />
          <LabelLayer />
          <MeasureTool />
          <PostFX />
        </Suspense>
        <ExplodeController />
        <SectionController />
        <ClockDriver />
        <AdaptiveDpr />
        <AdaptiveEvents />
      </PerformanceMonitor>
    </Canvas>
  );
}
