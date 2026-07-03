'use client';

import { useEffect, useRef, useState } from 'react';
import { animationClock } from '@/state/animationClock';
import { useActiveHardware, useHardwareStore } from '@/state/useHardwareStore';
import { Icon } from './icons';
import { Dropdown, IconButton, Slider, cx } from './primitives';

function useClock() {
  const [, force] = useState(0);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const unsub = animationClock.subscribe(() => force((v) => v + 1));
    const loop = () => {
      setProgress(animationClock.progress);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      unsub();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return progress;
}

interface AnimationBarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

/**
 * Playback control bar — pick an educational process, play / pause / restart /
 * loop it, adjust speed, scrub the timeline, enter fullscreen.
 */
export function AnimationBar({ isFullscreen, onToggleFullscreen }: AnimationBarProps) {
  const hardware = useActiveHardware();
  const activeAnimationId = useHardwareStore((s) => s.activeAnimationId);
  const setActiveAnimation = useHardwareStore((s) => s.setActiveAnimation);
  const progress = useClock();
  const playing = animationClock.playing;
  const speed = animationClock.speed;

  return (
    <div className="mt-4 flex items-stretch gap-4">
      <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden rounded-xl border border-border bg-surface1 px-4 py-3 shadow-elevation-1 tablet:px-5">
        {/* Timeline scrubber — thin strip across the top edge */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-surface2">
          <div
            className="h-full bg-accent transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
          <input
            type="range"
            aria-label="Animation timeline"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => animationClock.scrub(parseFloat(e.target.value))}
            className="absolute inset-x-0 -top-1.5 h-4 w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
        </div>

        {/* Play cluster */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={playing ? 'Pause animation' : 'Resume animation'}
            onClick={() => animationClock.toggle()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_14px_rgba(246,130,31,0.4)] transition-transform hover:scale-105 active:scale-95"
          >
            <Icon name={playing ? 'pause' : 'play'} size="md" className={playing ? '' : 'ml-0.5'} />
          </button>
          <div className="leading-tight">
            <div className="text-sm font-bold text-text-primary">
              {playing ? 'Pause' : 'Resume'}
            </div>
            <div className="text-xs text-text-tertiary">Animation</div>
          </div>
          <div className="ml-1 flex items-center">
            <IconButton icon="restart" label="Restart" size="sm" tooltipSide="top" onClick={() => animationClock.restart()} />
            <IconButton
              icon="loop"
              label="Loop"
              size="sm"
              active={animationClock.loop}
              tooltipSide="top"
              onClick={() => animationClock.setLoop(!animationClock.loop)}
            />
          </div>
        </div>

        <span aria-hidden className="hidden h-9 w-px bg-border tablet:block" />

        {/* Process picker */}
        <div className="min-w-0">
          <div className="text-xs text-text-tertiary">Process</div>
          <Dropdown
            label="Educational animation"
            value={activeAnimationId ?? '__none'}
            options={[
              { value: '__none', label: 'No animation' },
              ...hardware.animations.map((a) => ({ value: a.id, label: a.name })),
            ]}
            onChange={(v) => setActiveAnimation(v === '__none' ? null : v)}
            buttonClassName="-ml-2.5 max-w-[220px] !text-sm !font-semibold !text-text-primary"
          />
        </div>

        <span aria-hidden className="hidden h-9 w-px bg-border laptop:block" />

        {/* Speed */}
        <div className="hidden min-w-0 flex-1 items-center gap-4 laptop:flex">
          <div className="shrink-0">
            <div className="text-xs text-text-tertiary">Speed</div>
            <div className="font-mono text-sm font-semibold tabular-nums text-text-primary">
              {speed}×
            </div>
          </div>
          <Slider
            label="Playback speed"
            value={speed}
            min={0.25}
            max={2}
            step={0.25}
            onChange={(v) => animationClock.setSpeed(v)}
            className="max-w-[380px]"
          />
        </div>
      </div>

      {/* Fullscreen card */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        className={cx(
          'flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-surface1 px-5 text-sm font-semibold text-text-primary shadow-elevation-1 transition-colors hover:bg-surface2',
        )}
      >
        <Icon name={isFullscreen ? 'fullscreenExit' : 'fullscreen'} size="md" className="text-text-secondary" />
        <span className="hidden tablet:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
      </button>
    </div>
  );
}
