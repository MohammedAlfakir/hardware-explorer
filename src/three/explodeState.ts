'use client';

import { Plane, Vector3 } from 'three';

/**
 * Mutable, non-reactive scene state read by parts every frame. GSAP tweens
 * `explode.value`; the section controller rewrites `sectionPlanes[0]`.
 * Kept out of React state so 60–120 fps updates never trigger renders.
 */

export const explode = { value: 0 };

/**
 * Shared clipping-plane array. The SAME array reference is assigned to every
 * part material; mutating its contents toggles the cross-section globally.
 */
export const sectionPlanes: Plane[] = [];

export const sectionPlane = new Plane(new Vector3(-1, 0, 0), 10);

export function setSectionEnabled(enabled: boolean) {
  if (enabled && sectionPlanes.length === 0) sectionPlanes.push(sectionPlane);
  if (!enabled) sectionPlanes.length = 0;
}
