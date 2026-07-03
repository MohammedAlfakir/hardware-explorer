/**
 * Event System — a tiny, fully-typed pub/sub bus used to decouple the UI
 * layer from the Three.js managers (UI Bridge). UI dispatches commands;
 * 3D systems subscribe and react.
 */

import type { ViewPreset } from '@/hardware/types';

export interface AppEvents {
  'camera:preset': { preset: ViewPreset };
  'camera:reset': void;
  'camera:fit': void;
  'camera:focus-part': { partId: string };
  'model:changed': { hardwareId: string };
}

type Handler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<keyof AppEvents, Set<Handler<never>>>();

  on<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>) {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>) {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]) {
    this.handlers.get(event)?.forEach((h) => (h as Handler<AppEvents[K]>)(payload));
  }
}

export const events = new EventBus();
