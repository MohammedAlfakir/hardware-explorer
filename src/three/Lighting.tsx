'use client';

import { Environment, Lightformer } from '@react-three/drei';

/**
 * Lighting Manager — a bright, neutral product-studio HDRI built from light
 * formers (no network fetch). Tuned for the light viewport: high ambient
 * bounce, one soft key with shadows, clean white reflections for metals.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[0, 4, 9]} intensity={0.35} color="#ffffff" />
      <directionalLight
        position={[5, 10, 4]}
        intensity={1.15}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-7, 5, -5]} intensity={0.3} color="#f2f4f8" />

      <Environment resolution={512} frames={1} environmentIntensity={1.25}>
        {/* Overhead softbox */}
        <Lightformer
          form="rect"
          intensity={3.2}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[10, 10, 1]}
          color="#ffffff"
        />
        {/* Cool-neutral rim, camera-left */}
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[-6, 2.4, -3]}
          rotation-y={Math.PI / 2.6}
          scale={[6, 3, 1]}
          color="#f4f6fa"
        />
        {/* Warm fill, camera-right */}
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[6, 1.8, 2]}
          rotation-y={-Math.PI / 2.4}
          scale={[5, 2.5, 1]}
          color="#fff1e2"
        />
        {/* Front softbox so camera-facing surfaces have reflections */}
        <Lightformer
          form="rect"
          intensity={1.7}
          position={[1.5, 2.4, 7]}
          rotation-y={0.15}
          scale={[8, 4, 1]}
          color="#ffffff"
        />
        {/* Horizon strip for smooth metal gradients */}
        <Lightformer
          form="ring"
          intensity={0.9}
          position={[0, 1, -7]}
          scale={[14, 3, 1]}
          color="#e8e9ec"
        />
        {/* Floor bounce so undersides stay readable */}
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[0, -4, 0]}
          rotation-x={-Math.PI / 2}
          scale={[9, 9, 1]}
          color="#dfdedb"
        />
      </Environment>
    </>
  );
}
