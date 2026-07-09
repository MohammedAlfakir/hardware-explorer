'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CameraControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import { Vector3 } from 'three';
import { events } from '@/lib/events';
import { HARDWARE } from '@/hardware/registry';
import type { ViewPreset } from '@/hardware/types';
import { useHardwareStore } from '@/state/useHardwareStore';
import { partRegistry } from './partRegistry';

const PRESET_DIRS: Record<ViewPreset, Vector3> = {
  front: new Vector3(0, 0.12, 1),
  back: new Vector3(0, 0.12, -1),
  left: new Vector3(-1, 0.12, 0),
  right: new Vector3(1, 0.12, 0),
  top: new Vector3(0.001, 1, 0.001),
  bottom: new Vector3(0.001, -1, 0.001),
  isometric: new Vector3(1, 0.72, 1),
};

/**
 * Camera Manager — professional damped orbit/pan/zoom controller with
 * animated preset views, fit-to-object, per-part focus and
 * perspective/orthographic projection. Touch gestures (one-finger orbit,
 * two-finger pan/pinch) are handled natively by camera-controls.
 */
export function CameraManager() {
  const controls = useRef<CameraControlsImpl | null>(null);
  const cameraMode = useHardwareStore((s) => s.cameraMode);
  const controlMode = useHardwareStore((s) => s.controlMode);
  const size = useThree((s) => s.size);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const modelRadius = () => {
    const b = HARDWARE[useHardwareStore.getState().activeHardwareId].bounds;
    return Math.max(b[0], b[1], b[2]);
  };

  const orthoFit = (radius: number) => {
    const s = sizeRef.current;
    return Math.min(s.width, s.height) / (radius * 1.9);
  };

  const goPreset = (preset: ViewPreset, animate = true) => {
    const c = controls.current;
    if (!c) return;
    const r = modelRadius();
    const dist = r * 1.85;
    const dir = PRESET_DIRS[preset].clone().normalize().multiplyScalar(dist);
    void c.setLookAt(dir.x, dir.y, dir.z, 0, 0, 0, animate);
    if (useHardwareStore.getState().cameraMode === 'orthographic') {
      void c.zoomTo(orthoFit(r), animate);
    }
  };

  useEffect(() => {
    const un = [
      events.on('camera:preset', ({ preset }) => goPreset(preset)),
      events.on('camera:reset', () => goPreset('isometric')),
      events.on('camera:fit', () => {
        const c = controls.current;
        if (!c) return;
        goPreset('isometric');
      }),
      events.on('camera:focus-part', ({ partId }) => {
        const c = controls.current;
        const entry = partRegistry.get(partId);
        if (!c || !entry) return;
        void c.fitToBox(entry.object, true, {
          paddingLeft: 0.9,
          paddingRight: 0.9,
          paddingTop: 0.7,
          paddingBottom: 0.7,
        });
      }),
      events.on('model:changed', () => goPreset('isometric')),
    ];
    return () => un.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Pull back while exploded so the separated assembly stays framed. */
  useEffect(() => {
    const unsub = useHardwareStore.subscribe(
      (s) => s.exploded,
      (exploded) => {
        const c = controls.current;
        if (!c) return;
        const factor = exploded ? 1.5 : 1 / 1.5;
        if (useHardwareStore.getState().cameraMode === 'orthographic') {
          void c.zoomTo(c.camera.zoom / factor, true);
        } else {
          void c.dollyTo(c.distance * factor, true);
        }
      },
    );
    return unsub;
  }, []);

  /* Re-frame when swapping projections. */
  useEffect(() => {
    const t = window.setTimeout(() => goPreset('isometric', false), 20);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode]);

  /* Rotate / Zoom / Pan control mode — remap the primary drag gesture. */
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const { ACTION } = CameraControlsImpl;
    c.mouseButtons.left =
      controlMode === 'pan' ? ACTION.TRUCK : controlMode === 'zoom' ? ACTION.DOLLY : ACTION.ROTATE;
    c.touches.one =
      controlMode === 'pan'
        ? ACTION.TOUCH_TRUCK
        : controlMode === 'zoom'
          ? ACTION.DOLLY
          : ACTION.TOUCH_ROTATE;
  }, [controlMode, cameraMode]);

  /* Keep zoom and pan scoped to the model — never let the user dolly (or,
   * in orthographic mode, zoom) past the piece, in either direction. */
  const applyZoomLimits = useCallback(() => {
    const c = controls.current;
    if (!c) return;
    const r = modelRadius();
    c.minDistance = r * 0.55;
    c.maxDistance = r * 4.5;
    c.minZoom = orthoFit(r) * 0.35;
    c.maxZoom = orthoFit(r) * 3.5;
    // Re-clamp the current distance/zoom immediately (e.g. after a model
    // swap where the new bounds are smaller than the old camera framing).
    void c.dollyTo(Math.min(Math.max(c.distance, c.minDistance), c.maxDistance), false);
    void c.zoomTo(Math.min(Math.max(c.camera.zoom, c.minZoom), c.maxZoom), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyZoomLimits();
  }, [cameraMode, applyZoomLimits]);

  useEffect(() => {
    const unsub = useHardwareStore.subscribe((s) => s.activeHardwareId, applyZoomLimits);
    return unsub;
  }, [applyZoomLimits]);

  /* Clamp the orbit target to a bounded radius around the model center so
   * panning can nudge the framing but never drag it far away. */
  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    const r = modelRadius();
    const maxPan = r * 0.75;
    const t = c.getTarget(new Vector3());
    const dist = t.length();
    if (dist > maxPan) {
      t.multiplyScalar(maxPan / dist);
      void c.setTarget(t.x, t.y, t.z, false);
    }
  });

  const r = modelRadius();

  return (
    <>
      {cameraMode === 'perspective' ? (
        <PerspectiveCamera makeDefault fov={38} near={0.1} far={200} position={[r * 1.4, r, r * 1.4]} />
      ) : (
        <OrthographicCamera makeDefault near={-100} far={200} position={[r * 1.4, r, r * 1.4]} zoom={90} />
      )}
      <CameraControls
        key={cameraMode}
        ref={controls}
        makeDefault
        smoothTime={0.28}
        draggingSmoothTime={0.08}
        minDistance={r * 0.55}
        maxDistance={r * 4.5}
        maxPolarAngle={Math.PI * 0.92}
        dollyToCursor
      />
    </>
  );
}
