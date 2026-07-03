'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
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
          ? ACTION.TOUCH_DOLLY
          : ACTION.TOUCH_ROTATE;
  }, [controlMode, cameraMode]);

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
        minDistance={1.2}
        maxDistance={40}
        maxPolarAngle={Math.PI * 0.92}
        dollyToCursor
      />
    </>
  );
}
