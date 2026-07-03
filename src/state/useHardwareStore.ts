'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { HardwareId, MaterialVariant, ViewPreset } from '@/hardware/types';
import { HARDWARE } from '@/hardware/registry';
import { events } from '@/lib/events';

export type CameraMode = 'perspective' | 'orthographic';
export type SectionAxis = 'x' | 'y' | 'z';
/** What the primary (left / one-finger) drag does in the viewport. */
export type ControlMode = 'rotate' | 'zoom' | 'pan';

interface HardwareStore {
  /* Model */
  activeHardwareId: HardwareId;
  setActiveHardware: (id: HardwareId) => void;
  /** Cross-fade flag while switching models. */
  modelTransitioning: boolean;

  /* Selection */
  selectedPartIds: string[];
  hoveredPartId: string | null;
  selectPart: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  setHoveredPart: (id: string | null) => void;

  /* Visibility */
  isolatedPartIds: string[];
  hiddenPartIds: string[];
  isolateSelection: () => void;
  isolatePart: (id: string) => void;
  clearIsolation: () => void;
  hidePart: (id: string) => void;
  unhideAll: () => void;

  /* View modes */
  exploded: boolean;
  explodeDistance: number; // 0..1
  toggleExploded: () => void;
  setExplodeDistance: (v: number) => void;
  labelsVisible: boolean;
  toggleLabels: () => void;
  wireframe: boolean;
  toggleWireframe: () => void;
  xray: boolean;
  toggleXray: () => void;

  /* Cross-section */
  sectionEnabled: boolean;
  sectionAxis: SectionAxis;
  sectionPosition: number; // -1..1 across model bounds
  toggleSection: () => void;
  setSectionAxis: (a: SectionAxis) => void;
  setSectionPosition: (v: number) => void;

  /* Measurement */
  measureMode: boolean;
  measurePoints: Array<[number, number, number]>;
  toggleMeasure: () => void;
  addMeasurePoint: (p: [number, number, number]) => void;
  clearMeasure: () => void;

  /* Materials */
  materialVariant: MaterialVariant;
  setMaterialVariant: (v: MaterialVariant) => void;

  /* Camera */
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  controlMode: ControlMode;
  setControlMode: (m: ControlMode) => void;
  applyPreset: (p: ViewPreset) => void;
  resetCamera: () => void;

  /* Animations */
  activeAnimationId: string | null;
  setActiveAnimation: (id: string | null) => void;

  /* Chrome */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  infoCardOpen: boolean;
  setInfoCardOpen: (open: boolean) => void;
}

export const useHardwareStore = create<HardwareStore>()(
  subscribeWithSelector((set, get) => ({
    activeHardwareId: 'gpu',
    modelTransitioning: false,
    setActiveHardware: (id) => {
      if (id === get().activeHardwareId) return;
      set({ modelTransitioning: true });
      // Let the outro play, then swap and settle.
      window.setTimeout(() => {
        set({
          activeHardwareId: id,
          selectedPartIds: [],
          hoveredPartId: null,
          isolatedPartIds: [],
          hiddenPartIds: [],
          exploded: false,
          measurePoints: [],
          activeAnimationId: null,
          infoCardOpen: false,
        });
        events.emit('model:changed', { hardwareId: id });
        window.setTimeout(() => set({ modelTransitioning: false }), 60);
      }, 260);
    },

    selectedPartIds: [],
    hoveredPartId: null,
    selectPart: (id, additive = false) => {
      const { selectedPartIds } = get();
      if (additive) {
        set({
          selectedPartIds: selectedPartIds.includes(id)
            ? selectedPartIds.filter((p) => p !== id)
            : [...selectedPartIds, id],
          infoCardOpen: true,
        });
      } else {
        set({ selectedPartIds: [id], infoCardOpen: true });
      }
    },
    clearSelection: () => set({ selectedPartIds: [], infoCardOpen: false }),
    setHoveredPart: (id) => set({ hoveredPartId: id }),

    isolatedPartIds: [],
    hiddenPartIds: [],
    isolateSelection: () => {
      const { selectedPartIds, isolatedPartIds } = get();
      if (isolatedPartIds.length > 0) {
        set({ isolatedPartIds: [] });
      } else if (selectedPartIds.length > 0) {
        set({ isolatedPartIds: [...selectedPartIds] });
      }
    },
    isolatePart: (id) => set({ isolatedPartIds: [id], selectedPartIds: [id] }),
    clearIsolation: () => set({ isolatedPartIds: [] }),
    hidePart: (id) =>
      set((s) => ({
        hiddenPartIds: [...new Set([...s.hiddenPartIds, id])],
        selectedPartIds: s.selectedPartIds.filter((p) => p !== id),
      })),
    unhideAll: () => set({ hiddenPartIds: [] }),

    exploded: false,
    explodeDistance: 0.65,
    toggleExploded: () => set((s) => ({ exploded: !s.exploded })),
    setExplodeDistance: (v) => set({ explodeDistance: v }),
    labelsVisible: true,
    toggleLabels: () => set((s) => ({ labelsVisible: !s.labelsVisible })),
    wireframe: false,
    toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
    xray: false,
    toggleXray: () => set((s) => ({ xray: !s.xray })),

    sectionEnabled: false,
    sectionAxis: 'x',
    sectionPosition: 0,
    toggleSection: () => set((s) => ({ sectionEnabled: !s.sectionEnabled })),
    setSectionAxis: (a) => set({ sectionAxis: a }),
    setSectionPosition: (v) => set({ sectionPosition: v }),

    measureMode: false,
    measurePoints: [],
    toggleMeasure: () =>
      set((s) => ({ measureMode: !s.measureMode, measurePoints: [] })),
    addMeasurePoint: (p) =>
      set((s) => ({
        measurePoints:
          s.measurePoints.length >= 2 ? [p] : [...s.measurePoints, p],
      })),
    clearMeasure: () => set({ measurePoints: [] }),

    materialVariant: 'factory',
    setMaterialVariant: (v) => set({ materialVariant: v }),

    cameraMode: 'perspective',
    setCameraMode: (m) => set({ cameraMode: m }),
    controlMode: 'rotate',
    setControlMode: (m) => set({ controlMode: m }),
    applyPreset: (p) => events.emit('camera:preset', { preset: p }),
    resetCamera: () => events.emit('camera:reset', undefined),

    activeAnimationId: null,
    setActiveAnimation: (id) => set({ activeAnimationId: id }),

    sidebarOpen: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    infoCardOpen: true,
    setInfoCardOpen: (open) => set({ infoCardOpen: open }),
  })),
);

/** Convenience selector: the active hardware definition. */
export const useActiveHardware = () =>
  useHardwareStore((s) => HARDWARE[s.activeHardwareId]);
