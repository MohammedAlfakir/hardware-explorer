'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { HARDWARE_LIST } from '@/hardware/registry';
import { Icon } from '@/ui/icons';
import { cx } from '@/ui/primitives';
import { resetStory, story } from './storyState';

const StoryScene = dynamic(() => import('./StoryScene').then((m) => m.StoryScene), {
  ssr: false,
});

const HEADLINE = ['SEE INSIDE', 'THE MACHINE.'];

const HERO_CHIPS = [
  { text: 'AXIAL-TECH · 11 BLADES', style: { right: '30vw', top: '22%' } },
  { text: '16 GB GDDR6 · 672 GB/S', style: { right: '6vw', top: '42%' } },
  { text: 'TDP 285 W · PCIE 5.0 ×16', style: { right: '26vw', top: '72%' } },
] as const;

const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/** Split headline into per-character spans for the reveal. */
function HeadlineChars() {
  return (
    <>
      {HEADLINE.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          {line.split('').map((ch, i) => (
            <span key={`${ch}-${i}`} className="hero-char inline-block will-change-transform" aria-hidden>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/** Blueprint grid + vignette layered behind the scene. */
function SceneBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 12%, #F5F4F2 0%, #E9E8E5 55%, #DCDBD7 100%)',
        }}
      />
      {/* Fine + major blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(25,25,25,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(25,25,25,0.032) 1px, transparent 1px), linear-gradient(rgba(25,25,25,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(25,25,25,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px, 32px 32px, 160px 160px, 160px 160px',
        }}
      />
      {/* Edge vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 80% at 50% 45%, transparent 55%, rgba(214,213,209,0.75) 100%)',
        }}
      />
    </>
  );
}

/**
 * The landing — a single full-screen hero. The GPU floats and slowly spins
 * beside the headline in a blueprint-grid studio, tracks the pointer, and
 * spec chips hover around it. One CTA: the workspace.
 */
export function HeroStory() {
  const wrapper = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorGlow = useRef<HTMLDivElement>(null);

  const partCount = HARDWARE_LIST.reduce((n, h) => n + h.parts.length, 0);
  const processCount = HARDWARE_LIST.reduce((n, h) => n + h.animations.length, 0);

  useLayoutEffect(() => {
    resetStory();

    const ctx = gsap.context(() => {
      /* Load-in choreography. */
      gsap.fromTo(
        '.hero-char',
        { yPercent: 115 },
        { yPercent: 0, stagger: 0.022, duration: 0.9, ease: 'power4.out', delay: 0.2 },
      );
      gsap.fromTo(
        '.hero-fade',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.09, duration: 0.7, ease: 'power3.out', delay: 0.55 },
      );
      gsap.fromTo(
        '.hero-chip',
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, stagger: 0.14, duration: 0.6, ease: 'back.out(2)', delay: 1.05 },
      );

      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
          compact: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (mmCtx) => {
          const cond = mmCtx.conditions as { desktop: boolean; compact: boolean; reduced: boolean };

          if (cond.reduced) {
            Object.assign(story, { x: 0, scale: 1, explode: 0, idleSpin: 0.04 });
            return;
          }

          Object.assign(story, { x: cond.desktop ? 1.9 : 0 });

          /* Idle float for the spec chips. */
          gsap.utils.toArray<HTMLElement>('.hero-chip-float').forEach((el, i) => {
            gsap.to(el, {
              y: i % 2 ? 10 : -10,
              duration: 2.4 + i * 0.35,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          });
        },
      );
    }, wrapper);

    /* ——— Pointer choreography ———
     * Parallax + velocity: the rig leans toward the cursor, and fast sweeps
     * pump `story.burst`, which breathes the assembly apart in the scene. */
    const fine = window.matchMedia('(pointer: fine)').matches;
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* GSAP owns the transform: center via xPercent/yPercent so quickTo x/y
     * composes instead of clobbering a CSS translate. */
    gsap.set([cursorRing.current, cursorDot.current, cursorGlow.current], {
      xPercent: -50,
      yPercent: -50,
    });

    const ringX = cursorRing.current && gsap.quickTo(cursorRing.current, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = cursorRing.current && gsap.quickTo(cursorRing.current, 'y', { duration: 0.45, ease: 'power3.out' });
    const dotX = cursorDot.current && gsap.quickTo(cursorDot.current, 'x', { duration: 0.12, ease: 'power2.out' });
    const dotY = cursorDot.current && gsap.quickTo(cursorDot.current, 'y', { duration: 0.12, ease: 'power2.out' });
    const glowX = cursorGlow.current && gsap.quickTo(cursorGlow.current, 'x', { duration: 0.7, ease: 'power3.out' });
    const glowY = cursorGlow.current && gsap.quickTo(cursorGlow.current, 'y', { duration: 0.7, ease: 'power3.out' });

    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let cursorShown = false;

    const onPointer = (e: PointerEvent) => {
      story.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      story.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      const t = performance.now();
      if (lastT && !noMotion) {
        const dt = Math.max(t - lastT, 8);
        const vx = (e.clientX - lastX) / dt;
        const vy = (e.clientY - lastY) / dt;
        const speed = Math.hypot(vx, vy); // px per ms, ~0..4
        story.burst = Math.min(1, story.burst + speed * 0.09);
        story.lean = Math.max(-1, Math.min(1, story.lean + vx * 0.12));
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = t;

      if (fine) {
        if (!cursorShown) {
          cursorShown = true;
          gsap.to([cursorRing.current, cursorDot.current, cursorGlow.current], { autoAlpha: 1, duration: 0.4 });
        }
        ringX?.(e.clientX);
        ringY?.(e.clientY);
        dotX?.(e.clientX);
        dotY?.(e.clientY);
        glowX?.(e.clientX);
        glowY?.(e.clientY);
      }
    };

    /* The ring swells over anything clickable. */
    const onOver = (e: PointerEvent) => {
      if (!fine || !cursorRing.current) return;
      const interactive = (e.target as HTMLElement).closest('a, button');
      gsap.to(cursorRing.current, {
        scale: interactive ? 2.1 : 1,
        opacity: interactive ? 0.45 : 1,
        duration: 0.35,
        ease: 'power3.out',
      });
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerover', onOver);
      ctx.revert();
      resetStory();
    };
  }, []);

  return (
    <div ref={wrapper} className="relative h-dvh min-h-[620px] overflow-hidden">
      <SceneBackdrop />

      {/* Cursor glow — a warm pool of light riding behind the pointer */}
      <div
        ref={cursorGlow}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[4] h-[560px] w-[560px] rounded-full opacity-0"
        style={{
          background:
            'radial-gradient(circle, rgba(246,130,31,0.13) 0%, rgba(246,130,31,0.05) 38%, transparent 68%)',
        }}
      />

      {/* Trailing ring cursor + exact dot */}
      <div
        ref={cursorRing}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 hidden h-9 w-9 rounded-full border-2 border-accent/70 opacity-0 mix-blend-multiply laptop:block"
      />
      <div
        ref={cursorDot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 hidden h-1.5 w-1.5 rounded-full bg-accent opacity-0 laptop:block"
      />

      {/* Giant outlined watermark behind the model */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[2vw] top-[10%] select-none text-[clamp(9rem,24vw,22rem)] font-extrabold leading-none tracking-tight"
        style={{ color: 'transparent', WebkitTextStroke: '2px rgba(25,25,25,0.07)' }}
      >
        GPU
      </div>

      <StoryScene />

      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: NOISE_URI }}
      />

      {/* Right rail: vertical brand line */}
      <div
        aria-hidden
        className="absolute right-7 top-1/2 z-[6] hidden -translate-y-1/2 rotate-180 font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-text-tertiary/70 laptop:block"
        style={{ writingMode: 'vertical-rl' }}
      >
        HardwareLab — Interactive Hardware Lab — EST. 2026
      </div>

      {/* Hero copy */}
      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-6 tablet:px-10">
          <p className="hero-fade mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">
            <span className="inline-block h-[2px] w-8 bg-accent" aria-hidden />
            HardwareLab · Interactive 3D Hardware
          </p>
          <h1 className="max-w-[12ch] text-[clamp(3.2rem,9.5vw,8.75rem)] font-extrabold leading-[0.94] tracking-tight text-text-primary">
            <HeadlineChars />
            <span className="sr-only">See inside the machine.</span>
          </h1>
          <p className="hero-fade mt-7 max-w-md text-lg leading-relaxed text-text-secondary">
            Rotate, dissect and explode real PC hardware — six museum-grade
            interactive 3D models, from silicon die to cooling fin.
          </p>
          <div className="hero-fade mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/explorer"
              className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-accent px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_28px_rgba(246,130,31,0.4)] transition-all hover:scale-[1.03] hover:shadow-[0_10px_36px_rgba(246,130,31,0.5)] active:scale-[0.98]"
            >
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              Launch Workspace
              <Icon name="chevronRight" size="sm" className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/explorer?model=cpu"
              className="flex items-center gap-3 rounded-full border border-border-strong bg-surface1/70 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-text-primary backdrop-blur transition-colors hover:border-text-primary"
            >
              Browse models
            </Link>
          </div>

          {/* Mini stat strip */}
          <dl className="hero-fade mt-12 flex max-w-md items-center divide-x divide-border-strong/70">
            {[
              [String(HARDWARE_LIST.length).padStart(2, '0'), 'Models'],
              [String(partCount), 'Parts'],
              [String(processCount), 'Processes'],
              ['120', 'FPS target'],
            ].map(([v, l], i) => (
              <div key={l} className={cx('pr-6', i > 0 && 'pl-6')}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-mono text-xl font-bold tabular-nums text-text-primary">
                  {v}
                  <span className="text-accent">+</span>
                </dd>
                <dd className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-text-tertiary">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Floating spec chips around the model */}
        {HERO_CHIPS.map((chip) => (
          <div
            key={chip.text}
            className="hero-chip pointer-events-none absolute z-10 hidden tablet-lg:block"
            style={chip.style}
            aria-hidden
          >
            <div className="hero-chip-float flex items-center gap-2.5 rounded-full border border-border bg-glass py-2 pl-3 pr-4 shadow-elevation-2 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">
                {chip.text}
              </span>
            </div>
          </div>
        ))}

        {/* Ticker */}
        <div className="relative z-10 overflow-hidden border-t border-border bg-surface1/60 py-3 backdrop-blur" aria-hidden>
          <div className="marquee flex w-max gap-10 whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-10 text-xs font-bold uppercase tracking-[0.28em] text-text-tertiary">
                {['GPU', 'CPU', 'RAM', 'SSD', 'Motherboard', 'Cooling Fan'].map((m) => (
                  <span key={m} className="flex items-center gap-10">
                    {m}
                    <span className="text-accent">◆</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
