'use client';

/**
 * Animation Manager — a frame-accurate clock driving the educational
 * animations. Kept outside React state so the 3D layer can read it every
 * frame at zero cost; UI components subscribe and sample it via rAF.
 */

export interface ClockState {
  time: number;
  duration: number;
  playing: boolean;
  speed: number;
  loop: boolean;
}

type Listener = () => void;

class AnimationClock {
  time = 0;
  duration = 6;
  playing = true;
  speed = 1;
  loop = true;

  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /** Advance by a frame delta (seconds). Called from useFrame. */
  tick(delta: number) {
    if (!this.playing) return;
    this.time += delta * this.speed;
    if (this.time >= this.duration) {
      if (this.loop) {
        this.time %= this.duration;
      } else {
        this.time = this.duration;
        this.playing = false;
        this.notify();
      }
    }
  }

  /** Normalized progress 0..1. */
  get progress() {
    return this.duration > 0 ? this.time / this.duration : 0;
  }

  play() {
    if (this.time >= this.duration) this.time = 0;
    this.playing = true;
    this.notify();
  }
  pause() {
    this.playing = false;
    this.notify();
  }
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }
  restart() {
    this.time = 0;
    this.playing = true;
    this.notify();
  }
  setSpeed(v: number) {
    this.speed = v;
    this.notify();
  }
  setLoop(v: boolean) {
    this.loop = v;
    this.notify();
  }
  scrub(progress: number) {
    this.time = Math.min(Math.max(progress, 0), 1) * this.duration;
    this.notify();
  }
  setDuration(d: number) {
    this.duration = d;
    this.time = 0;
    this.notify();
  }
}

export const animationClock = new AnimationClock();
