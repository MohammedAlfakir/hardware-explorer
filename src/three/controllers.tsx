'use client';

import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { Vector3 } from 'three';
import { HARDWARE } from '@/hardware/registry';
import { animationClock } from '@/state/animationClock';
import { useHardwareStore } from '@/state/useHardwareStore';
import { motion } from '@/design/tokens';
import { explode, sectionPlane, setSectionEnabled } from './explodeState';

/**
 * ExplodeController — tweens the global explode factor with GSAP so every
 * part separates (and re-assembles) along its authored axis in one motion.
 */
export function ExplodeController() {
  const exploded = useHardwareStore((s) => s.exploded);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const tween = gsap.to(explode, {
      value: exploded ? 1 : 0,
      duration: reduceMotion ? 0 : motion.duration.explode,
      ease: motion.ease.gsapExplode,
      overwrite: true,
    });
    return () => {
      tween.kill();
    };
  }, [exploded, reduceMotion]);

  return null;
}

/**
 * SectionController — drives the shared clipping plane from cross-section
 * state (axis + sweep position across the model bounds).
 */
export function SectionController() {
  const enabled = useHardwareStore((s) => s.sectionEnabled);
  const axis = useHardwareStore((s) => s.sectionAxis);
  const position = useHardwareStore((s) => s.sectionPosition);
  const hardwareId = useHardwareStore((s) => s.activeHardwareId);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  useEffect(() => {
    setSectionEnabled(enabled);
    if (!enabled) return;
    const bounds = HARDWARE[hardwareId].bounds;
    const extent =
      (axis === 'x' ? bounds[0] : axis === 'y' ? bounds[1] : bounds[2]) / 2 + 0.4;
    const normal = new Vector3(
      axis === 'x' ? -1 : 0,
      axis === 'y' ? -1 : 0,
      axis === 'z' ? -1 : 0,
    );
    sectionPlane.normal.copy(normal);
    // Explode expands the model — widen the sweep range accordingly.
    sectionPlane.constant = position * extent * (1 + explode.value * 1.6) + 0.001;
  }, [enabled, axis, position, hardwareId]);

  return null;
}

/**
 * ClockDriver — advances the educational-animation clock in lockstep with
 * the render loop and resets its duration when the user picks another
 * animation.
 */
export function ClockDriver() {
  const hardwareId = useHardwareStore((s) => s.activeHardwareId);
  const animationId = useHardwareStore((s) => s.activeAnimationId);

  useEffect(() => {
    const def = HARDWARE[hardwareId].animations.find((a) => a.id === animationId);
    animationClock.setDuration(def?.duration ?? 6);
    animationClock.play();
  }, [hardwareId, animationId]);

  useFrame((_, delta) => {
    animationClock.tick(Math.min(delta, 0.1));
  });

  return null;
}
