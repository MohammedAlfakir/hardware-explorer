'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Group, MathUtils, PointLight } from 'three';
import { GpuModel } from '@/hardware/models/Gpu';
import { Lighting } from '@/three/Lighting';
import { explode } from '@/three/explodeState';
import { story } from './storyState';

/**
 * The hero/story hardware rig. An outer group follows the GSAP scroll
 * timeline (via the mutable story object); an inner group layers on idle
 * rotation, a gentle float and pointer parallax.
 */
function StoryRig() {
  const outer = useRef<Group>(null!);
  const inner = useRef<Group>(null!);
  const spin = useRef(0);

  useEffect(() => {
    // The landing drives the shared explode state directly; make sure the
    // workspace starts assembled when the user navigates there.
    return () => {
      explode.value = 0;
    };
  }, []);

  useFrame((state, delta) => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;

    /* Pointer energy decays on its own; while present it breathes the
     * assembly slightly apart (micro-explode) with an eased response. */
    story.burst = Math.max(0, story.burst - delta * (0.9 + story.burst * 1.4));
    story.lean *= Math.exp(-delta * 2.4);
    const breathe = story.burst * (2 - story.burst); // ease-out
    explode.value = Math.min(1, story.explode + breathe * 0.16);

    spin.current += delta * (story.idleSpin + story.burst * 0.25);

    const t = state.clock.elapsedTime;
    const k = Math.min(delta * 6, 1);

    o.position.x = MathUtils.lerp(o.position.x, story.x, k);
    o.position.y = MathUtils.lerp(o.position.y, story.y + Math.sin(t * 0.8) * 0.07, k);
    o.scale.setScalar(MathUtils.lerp(o.scale.x, story.scale * (1 + breathe * 0.015), k));
    o.rotation.x = MathUtils.lerp(o.rotation.x, story.rotX + story.mouseY * 0.09, k);
    o.rotation.y = MathUtils.lerp(o.rotation.y, story.rotY + spin.current + story.mouseX * 0.14, k);

    i.rotation.z = Math.sin(t * 0.5) * 0.02 + story.lean * 0.11;
  });

  return (
    <group ref={outer} position={[story.x, 0, 0]} rotation={[story.rotX, story.rotY, 0]}>
      <group ref={inner}>
        <GpuModel />
      </group>
    </group>
  );
}

/** Landing 3D canvas — one persistent scene behind the hero + explode story. */
export function StoryScene() {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      className="!absolute inset-0"
      aria-label="Exploding 3D graphics card"
      role="img"
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault fov={35} near={0.1} far={100} position={[0, 2.6, 9.2]} rotation={[-0.22, 0, 0]} />
        <Lighting />
        {/* Warm brand rim so the metal picks up a hint of orange */}
        <directionalLight position={[-6, -2, 4]} intensity={0.35} color="#f6a55c" />
        <CursorLight />
        <StoryRig />
        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.35}
          scale={22}
          blur={2.6}
          far={5.5}
          resolution={512}
          frames={Infinity}
          color="#3a3632"
        />
        <AdaptiveDpr />
      </Suspense>
      {/* Drop resolution first if the GPU can't keep up */}
      <PerfGuard onDecline={() => setDpr([1, 1.25])} />
    </Canvas>
  );
}

/**
 * A warm key light glued to the cursor — reflections sweep across the
 * brushed metal as the pointer moves, and it flares with pointer energy.
 */
function CursorLight() {
  const ref = useRef<PointLight>(null!);
  useFrame((_, delta) => {
    const l = ref.current;
    if (!l) return;
    const k = Math.min(delta * 9, 1);
    l.position.x = MathUtils.lerp(l.position.x, story.mouseX * 6, k);
    l.position.y = MathUtils.lerp(l.position.y, 2.4 - story.mouseY * 3.2, k);
    l.intensity = MathUtils.lerp(l.intensity, 26 * (0.55 + story.burst), k);
  });
  return <pointLight ref={ref} position={[0, 2.4, 3.6]} distance={14} decay={2} color="#ffe2c2" intensity={14} />;
}

function PerfGuard({ onDecline }: { onDecline: () => void }) {
  const last = useRef(performance.now());
  const slow = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    const now = performance.now();
    const dt = now - last.current;
    last.current = now;
    if (done.current) return;
    slow.current = dt > 28 ? slow.current + 1 : 0;
    if (slow.current > 90) {
      done.current = true;
      onDecline();
    }
  });
  return null;
}
