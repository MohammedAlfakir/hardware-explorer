'use client';

/**
 * Landing scroll-story state — a mutable, non-reactive bridge between the
 * GSAP timeline (DOM side) and the R3F scene (canvas side). GSAP tweens these
 * numbers on scroll; the scene lerps toward them every frame, so scrubbing
 * stays butter-smooth without a single React render.
 */
export const story = {
  /** Model group transform */
  x: 1.9,
  y: 0,
  scale: 1,
  rotX: 0.16,
  rotY: -0.55,
  /** Exploded-assembly progress 0..1 (drives the shared explode state). */
  explode: 0,
  /** Extra idle spin speed (rad/s) — eased off during the exploded phase. */
  idleSpin: 0.12,
  /** Pointer parallax, -1..1, written by the wrapper's pointermove. */
  mouseX: 0,
  mouseY: 0,
  /** Pointer-energy 0..1 — fast cursor sweeps pump it up, the rig decays it.
   *  Drives the micro-explode "breathing" and the cursor light boost. */
  burst: 0,
  /** Horizontal lean (-1..1) from pointer velocity — the card banks into
   *  the motion like it has mass. */
  lean: 0,
};

export const STORY_DEFAULTS = { ...story };

export function resetStory() {
  Object.assign(story, STORY_DEFAULTS);
}
