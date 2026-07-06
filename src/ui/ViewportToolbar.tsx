'use client';

import { AnimatePresence, motion as fm } from 'framer-motion';
import type { MaterialVariant, ViewPreset } from '@/hardware/types';
import type { ControlMode } from '@/state/useHardwareStore';
import { useHardwareStore } from '@/state/useHardwareStore';
import { motion as motionTokens } from '@/design/tokens';
import type { IconName } from './icons';
import { Icon } from './icons';
import { Dropdown, IconButton, Separator, Slider, Toggle, cx } from './primitives';

const VIEW_OPTIONS: Array<{ value: ViewPreset; label: string }> = [
  { value: 'isometric', label: 'Isometric' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
];

const MATERIAL_OPTIONS: Array<{ value: MaterialVariant; label: string }> = [
  { value: 'factory', label: 'Factory finish' },
  { value: 'polished', label: 'Polished' },
  { value: 'stealth', label: 'Stealth' },
];

const CONTROL_MODES: Array<{ value: ControlMode; icon: IconName; label: string }> = [
  { value: 'rotate', icon: 'rotate', label: 'Rotate' },
  { value: 'zoom', icon: 'zoom', label: 'Zoom' },
  { value: 'pan', icon: 'pan', label: 'Pan' },
];

interface RowProps {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

/** A labeled control row — icon, name, optional trailing control. */
function ControlRow({ icon, label, active = false, onClick, trailing, disabled }: RowProps) {
  const inner = (
    <>
      <Icon name={icon} size="md" className={active ? 'text-accent' : 'text-text-secondary'} />
      <span className="flex-1">{label}</span>
    </>
  );
  const rowClass = cx(
    'flex h-11 w-full items-center gap-3 px-4 text-left text-sm font-medium transition-colors',
    disabled && 'cursor-not-allowed opacity-40',
    active ? 'text-accent' : 'text-text-primary',
    !disabled && 'hover:bg-surface2',
  );

  // When the row carries an interactive trailing control (e.g. a Toggle, itself
  // a <button>), the row cannot be a <button> too — nesting buttons is invalid
  // HTML. Render the clickable area as its own button and keep the trailing
  // control a sibling instead.
  if (trailing) {
    return (
      <div className={cx(rowClass, 'gap-0')}>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed={onClick ? active : undefined}
          className="flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
        >
          {inner}
        </button>
        {trailing}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={onClick ? active : undefined}
      className={rowClass}
    >
      {inner}
    </button>
  );
}

function PanelDivider() {
  return <div aria-hidden className="mx-4 h-px bg-border-subtle" />;
}

/** Floating white control panels — reference-design rows + advanced tools. */
export function ViewportToolbar() {
  const s = useHardwareStore();

  return (
    <>
      {/* Primary panel — top right (reference design) */}
      <div className="pointer-events-none absolute right-4 top-4 z-20 flex w-[196px] flex-col gap-3">
        <div className="pointer-events-auto overflow-hidden rounded-xl bg-surface1 shadow-elevation-3 ring-1 ring-border/60">
          {CONTROL_MODES.map((mode, i) => (
            <div key={mode.value}>
              {i > 0 && <PanelDivider />}
              <ControlRow
                icon={mode.icon}
                label={mode.label}
                active={s.controlMode === mode.value}
                onClick={() => s.setControlMode(mode.value)}
              />
            </div>
          ))}
          <PanelDivider />
          <ControlRow
            icon="tag"
            label="Labels"
            onClick={s.toggleLabels}
            trailing={<Toggle checked={s.labelsVisible} onChange={s.toggleLabels} label="Show labels" />}
          />
          <PanelDivider />
          <ControlRow
            icon="box"
            label="Isolate"
            active={s.isolatedPartIds.length > 0}
            onClick={s.isolateSelection}
            disabled={s.selectedPartIds.length === 0 && s.isolatedPartIds.length === 0}
          />
        </div>

        {/* Advanced tools — same visual language */}
        <div className="pointer-events-auto overflow-hidden rounded-xl bg-surface1 shadow-elevation-3 ring-1 ring-border/60">
          <ControlRow icon="explode" label="Explode" active={s.exploded} onClick={s.toggleExploded} />
          <PanelDivider />
          <ControlRow icon="xray" label="X-Ray" active={s.xray} onClick={s.toggleXray} />
          <PanelDivider />
          <ControlRow icon="wireframe" label="Wireframe" active={s.wireframe} onClick={s.toggleWireframe} />
          <PanelDivider />
          <ControlRow icon="section" label="Section" active={s.sectionEnabled} onClick={s.toggleSection} />
          <PanelDivider />
          <ControlRow icon="ruler" label="Measure" active={s.measureMode} onClick={s.toggleMeasure} />
        </div>

        {/* Explode distance */}
        <AnimatePresence>
          {s.exploded && (
            <fm.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
              className="pointer-events-auto rounded-xl bg-surface1 px-4 py-3 shadow-elevation-3 ring-1 ring-border/60"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
                Spread
              </span>
              <Slider
                label="Explosion distance"
                value={s.explodeDistance}
                onChange={s.setExplodeDistance}
                className="mt-2"
              />
            </fm.div>
          )}
        </AnimatePresence>

        {/* Cross-section controls */}
        <AnimatePresence>
          {s.sectionEnabled && (
            <fm.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
              className="pointer-events-auto flex flex-col gap-2.5 rounded-xl bg-surface1 px-4 py-3 shadow-elevation-3 ring-1 ring-border/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
                  Section
                </span>
                <div className="flex gap-1" role="radiogroup" aria-label="Section axis">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <button
                      key={axis}
                      type="button"
                      role="radio"
                      aria-checked={s.sectionAxis === axis}
                      onClick={() => s.setSectionAxis(axis)}
                      className={cx(
                        'h-5 w-5 rounded-[4px] font-mono text-[10px] font-semibold uppercase transition-colors',
                        s.sectionAxis === axis
                          ? 'bg-accent text-white'
                          : 'bg-surface2 text-text-tertiary hover:text-text-primary',
                      )}
                    >
                      {axis}
                    </button>
                  ))}
                </div>
              </div>
              <Slider
                label="Section position"
                value={s.sectionPosition}
                min={-1}
                max={1}
                onChange={s.setSectionPosition}
              />
            </fm.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom-right — camera cluster */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl bg-surface1 p-1 shadow-elevation-3 ring-1 ring-border/60">
          {(s.hiddenPartIds.length > 0 || s.isolatedPartIds.length > 0) && (
            <>
              <button
                type="button"
                onClick={() => {
                  s.unhideAll();
                  s.clearIsolation();
                }}
                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-2xs font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                Show all
              </button>
              <Separator vertical />
            </>
          )}
          <Dropdown
            label="Camera view preset"
            value={'isometric' as ViewPreset}
            options={VIEW_OPTIONS}
            onChange={(v) => s.applyPreset(v)}
          />
          <Separator vertical />
          <IconButton
            icon={s.cameraMode === 'perspective' ? 'cameraPerspective' : 'cameraOrtho'}
            label={s.cameraMode === 'perspective' ? 'Switch to orthographic' : 'Switch to perspective'}
            kbd="O"
            tooltipSide="top"
            onClick={() => s.setCameraMode(s.cameraMode === 'perspective' ? 'orthographic' : 'perspective')}
          />
          <Dropdown
            label="Material finish"
            value={s.materialVariant}
            options={MATERIAL_OPTIONS.map((o) => ({ ...o, icon: 'palette' as const }))}
            onChange={s.setMaterialVariant}
            compact
          />
          <Separator vertical />
          <IconButton icon="fit" label="Fit to view" kbd="F" tooltipSide="top" onClick={() => s.applyPreset('isometric')} />
          <IconButton icon="reset" label="Reset camera" kbd="R" tooltipSide="top" onClick={s.resetCamera} />
        </div>
      </div>
    </>
  );
}
