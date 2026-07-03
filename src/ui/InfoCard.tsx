'use client';

import { AnimatePresence, motion as fm } from 'framer-motion';
import { getPart } from '@/hardware/registry';
import { events } from '@/lib/events';
import { useActiveHardware, useHardwareStore } from '@/state/useHardwareStore';
import { motion as motionTokens } from '@/design/tokens';
import { Icon } from './icons';
import { GlassPanel, IconButton, cx } from './primitives';

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="shrink-0 text-2xs text-text-tertiary">{label}</dt>
      <dd className="text-right font-mono text-2xs font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function PartDetails({ partId }: { partId: string }) {
  const hardware = useActiveHardware();
  const store = useHardwareStore.getState();
  const part = getPart(hardware.id, partId);
  if (!part) return null;

  const index = hardware.parts.findIndex((p) => p.id === partId) + 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-2.5 px-4 pt-3.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-muted font-mono text-2xs font-bold text-accent-bright">
          {index}
        </span>
        <div className="min-w-0">
          <h3 className="text-md font-semibold leading-snug text-text-primary">{part.name}</h3>
          <p className="mt-0.5 text-2xs uppercase tracking-wide text-text-tertiary">
            {hardware.shortName} component
          </p>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2.5">
        <p className="text-xs leading-relaxed text-text-secondary">{part.description}</p>

        {part.specs && part.specs.length > 0 && (
          <>
            <h4 className="mb-1 mt-3.5 text-2xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Specifications
            </h4>
            <dl className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface2 px-2.5 py-1">
              {part.specs.map((spec) => (
                <SpecRow key={spec.label} {...spec} />
              ))}
            </dl>
          </>
        )}

        {part.education && (
          <div className="mt-3.5 rounded-md border border-accent/25 bg-accent-muted p-3">
            <div className="mb-1 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-accent-bright">
              <Icon name="book" size="xs" />
              How it works
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">{part.education}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-border-subtle px-3 py-2.5">
        <button
          type="button"
          onClick={() => events.emit('camera:focus-part', { partId })}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-sm bg-accent text-xs font-medium text-white transition-all hover:bg-accent-bright active:scale-[0.97]"
        >
          <Icon name="focus" size="sm" />
          Focus
        </button>
        <button
          type="button"
          onClick={() => useHardwareStore.getState().isolatePart(partId)}
          className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-sm border border-border bg-surface3 text-xs font-medium text-text-primary transition-all hover:border-border-strong active:scale-[0.97]"
        >
          <Icon name="isolate" size="sm" />
          Isolate
        </button>
        <IconButton icon="eyeOff" label="Hide part" tooltipSide="top" onClick={() => store.hidePart(partId)} />
      </div>
    </div>
  );
}

function HardwareOverview() {
  const hardware = useActiveHardware();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-3.5">
        <h3 className="text-md font-semibold leading-snug text-text-primary">{hardware.name}</h3>
        <p className="mt-0.5 text-2xs text-text-tertiary">{hardware.tagline}</p>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2.5">
        <p className="text-xs leading-relaxed text-text-secondary">{hardware.description}</p>

        <h4 className="mb-1 mt-3.5 text-2xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Specifications
        </h4>
        <dl className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface2 px-2.5 py-1">
          {hardware.specs.map((spec) => (
            <SpecRow key={spec.label} {...spec} />
          ))}
        </dl>

        <h4 className="mb-1.5 mt-3.5 text-2xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Did you know
        </h4>
        <ul className="flex flex-col gap-1.5">
          {hardware.facts.map((fact, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-text-secondary">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              {fact}
            </li>
          ))}
        </ul>

        <p className="mt-3.5 rounded-md border border-border-subtle bg-surface2 p-2.5 text-2xs leading-relaxed text-text-tertiary">
          Click any component in the viewport (or a floating label) to inspect
          it. Shift-click for multi-selection, press E for the exploded view.
        </p>
      </div>
    </div>
  );
}

/** Information card — hardware overview, or details for the selected part. */
export function InfoCard() {
  const selected = useHardwareStore((s) => s.selectedPartIds);
  const open = useHardwareStore((s) => s.infoCardOpen);
  const setOpen = useHardwareStore((s) => s.setInfoCardOpen);
  const clearSelection = useHardwareStore((s) => s.clearSelection);
  const lastSelected = selected[selected.length - 1] ?? null;

  return (
    <>
      {/* Toggle when closed */}
      <AnimatePresence>
        {!open && (
          <fm.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="absolute left-4 top-4 z-20"
          >
            <GlassPanel className="p-1">
              <IconButton icon="info" label="Show details" tooltipSide="right" onClick={() => setOpen(true)} />
            </GlassPanel>
          </fm.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <fm.div
            key="info-card"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
            className={cx(
              'absolute z-20 flex flex-col',
              // Desktop: floating left panel. Mobile: bottom sheet above the control bar.
              'left-4 top-4 bottom-4 w-[320px] max-w-[calc(100%-32px)]',
              'max-tablet:inset-x-3 max-tablet:top-auto max-tablet:bottom-3 max-tablet:max-h-[50%] max-tablet:w-auto',
            )}
          >
            <GlassPanel className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-border-subtle pl-4 pr-2">
                <span className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                  <Icon name="layers" size="xs" />
                  {lastSelected ? 'Component' : 'Overview'}
                </span>
                <div className="flex items-center">
                  {lastSelected && (
                    <>
                      {selected.length > 1 && (
                        <span className="mr-1 rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[10px] text-accent-bright">
                          {selected.length} selected
                        </span>
                      )}
                      <IconButton icon="chevronRight" label="Back to overview" size="sm" onClick={clearSelection} className="-rotate-180" />
                    </>
                  )}
                  <IconButton icon="close" label="Close details" size="sm" onClick={() => setOpen(false)} />
                </div>
              </div>
              {lastSelected ? <PartDetails partId={lastSelected} /> : <HardwareOverview />}
            </GlassPanel>
          </fm.div>
        )}
      </AnimatePresence>
    </>
  );
}
