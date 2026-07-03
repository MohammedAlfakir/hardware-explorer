'use client';

import type { Object3D } from 'three';
import type { PartDefinition } from '@/hardware/types';

/**
 * Picking Manager support — live map of mounted part ids to their scene
 * objects, so the camera and label systems can resolve parts without
 * traversing the graph.
 */

export interface RegisteredPart {
  object: Object3D;
  /** Anchor placed at the part's geometric center (used by labels/camera). */
  anchor: Object3D;
  definition: PartDefinition;
}

const parts = new Map<string, RegisteredPart>();

export const partRegistry = {
  register(id: string, entry: RegisteredPart) {
    parts.set(id, entry);
  },
  unregister(id: string) {
    parts.delete(id);
  },
  get(id: string) {
    return parts.get(id) ?? null;
  },
  all() {
    return parts;
  },
};
