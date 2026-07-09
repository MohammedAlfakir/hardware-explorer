'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { events } from '@/lib/events';
import { animationClock } from '@/state/animationClock';
import { useActiveHardware, useHardwareStore } from '@/state/useHardwareStore';
import { Icon } from '@/ui/icons';
import { InfoCard } from '@/ui/InfoCard';
import { IconButton } from '@/ui/primitives';
import { Sidebar } from '@/ui/Sidebar';
import { StatCards } from '@/ui/StatCards';
import { ViewportToolbar } from '@/ui/ViewportToolbar';

const SceneManager = dynamic(
  () => import('@/three/SceneManager').then((m) => m.SceneManager),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    ),
  },
);

/** Global keyboard shortcuts (skipped while typing in form fields). */
function useHotkeys() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useHardwareStore.getState();
      switch (e.key.toLowerCase()) {
        case 'e': s.toggleExploded(); break;
        case 'l': s.toggleLabels(); break;
        case 'w': s.toggleWireframe(); break;
        case 'x': s.toggleXray(); break;
        case 'c': s.toggleSection(); break;
        case 'm': s.toggleMeasure(); break;
        case 'i': s.isolateSelection(); break;
        case 'o': s.setCameraMode(s.cameraMode === 'perspective' ? 'orthographic' : 'perspective'); break;
        case 'r': s.resetCamera(); break;
        case 'f':
          if (s.selectedPartIds.length === 1) {
            events.emit('camera:focus-part', { partId: s.selectedPartIds[0] });
          } else {
            events.emit('camera:fit', undefined);
          }
          break;
        case ' ':
          e.preventDefault();
          animationClock.toggle();
          break;
        case 'escape':
          if (s.measureMode) s.toggleMeasure();
          else if (s.isolatedPartIds.length > 0) s.clearIsolation();
          else s.clearSelection();
          break;
        default:
          return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

/** Deep-link support: /explorer?model=cpu selects a model (reactively). */
function useModelQueryParam() {
  const params = useSearchParams();
  useEffect(() => {
    const id = params.get('model');
    const s = useHardwareStore.getState();
    if (id && id !== s.activeHardwareId && ['cpu', 'gpu', 'ram', 'ssd', 'motherboard', 'cooling-fan'].includes(id)) {
      s.setActiveHardware(id as Parameters<typeof s.setActiveHardware>[0]);
    }
  }, [params]);
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={null}>
      <ExplorerShell />
    </Suspense>
  );
}

function ExplorerShell() {
  useHotkeys();
  useModelQueryParam();
  const shell = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const measureMode = useHardwareStore((s) => s.measureMode);
  const setSidebarOpen = useHardwareStore((s) => s.setSidebarOpen);
  const hardware = useActiveHardware();

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void shell.current?.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <div ref={shell} className="flex h-dvh overflow-hidden bg-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          aria-label="Hardware explorer"
          className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col px-4 pb-8 pt-6 tablet:px-7">
            {/* Heading */}
            <header className="mb-5 flex items-start gap-3">
              {/* Mobile drawer trigger — sidebar is off-canvas below lg */}
              <button
                type="button"
                aria-label="Open hardware library"
                onClick={() => setSidebarOpen(true)}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-surface2 hover:text-text-primary tablet-lg:hidden"
              >
                <Icon name="menu" size="lg" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary tablet:text-4xl">
                  {hardware.shortName}
                </h1>
                <p className="mt-1 text-md text-text-tertiary">
                  Interactive hardware component model
                </p>
              </div>
            </header>

            {/* 3D viewport */}
            <section
              aria-label="3D viewport"
              className="relative min-h-[520px] overflow-hidden rounded-xl"
              style={{ height: isFullscreen ? '82vh' : '72vh' }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 100% at 50% 40%, #F1F0EE 0%, #E7E6E3 100%)',
                }}
              />
              <SceneManager />
              <ViewportToolbar />
              <InfoCard />
              {measureMode && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-amber/40 bg-glass px-3 py-1.5 text-2xs font-medium text-amber shadow-elevation-2 backdrop-blur-xl">
                  Measure — click two points on the model
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-20">
                <IconButton
                  icon={isFullscreen ? 'fullscreenExit' : 'fullscreen'}
                  label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  tooltipSide="top"
                  onClick={toggleFullscreen}
                  className="border border-border bg-surface1 shadow-elevation-2"
                />
              </div>
            </section>

            {/* Headline stat cards */}
            <StatCards />

            {/* About */}
            <section aria-label="About this component" className="mt-4 grid gap-4 tablet-lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-xl border border-border bg-surface1 p-6 shadow-elevation-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
                  About the {hardware.shortName}
                </h2>
                <p className="mt-3 text-md leading-relaxed text-text-secondary">
                  {hardware.description}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {hardware.facts.map((fact, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
                      <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-surface1 p-6 shadow-elevation-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-text-tertiary">
                  Specifications
                </h2>
                <dl className="mt-3 divide-y divide-border-subtle">
                  {hardware.specs.map((spec) => (
                    <div key={spec.label} className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="text-sm text-text-tertiary">{spec.label}</dt>
                      <dd className="text-right font-mono text-sm font-medium text-text-primary">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
