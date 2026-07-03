'use client';

import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Renderer Manager post-processing chain: screen-space ambient occlusion
 * (N8AO), subtle bloom for emissive elements, ACES filmic tone mapping and
 * SMAA anti-aliasing.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      <N8AO
        aoRadius={0.55}
        intensity={1.35}
        distanceFalloff={0.7}
        quality="performance"
        halfRes
      />
      <Bloom intensity={0.18} luminanceThreshold={1.05} luminanceSmoothing={0.3} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
