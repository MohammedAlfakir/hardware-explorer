'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as fm } from 'framer-motion';
import { motion as motionTokens } from '@/design/tokens';
import { Icon, type IconName } from './icons';

/* ---------------------------------------------------------------- utils */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const EASE = motionTokens.ease.out;

/* ----------------------------------------------------------- IconButton */

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  active?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md';
  kbd?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, active = false, tooltipSide = 'bottom', size = 'md', kbd, className, ...rest },
    ref,
  ) {
    return (
      <Tooltip label={label} kbd={kbd} side={tooltipSide}>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          aria-pressed={active}
          className={cx(
            'relative flex items-center justify-center rounded-sm transition-colors duration-150',
            size === 'md' ? 'h-8 w-8' : 'h-7 w-7',
            active
              ? 'bg-accent-muted text-accent-bright'
              : 'text-text-secondary hover:bg-surface3 hover:text-text-primary',
            'active:scale-[0.94] transition-transform',
            className,
          )}
          {...rest}
        >
          <Icon name={icon} size={size === 'md' ? 'md' : 'sm'} />
          {active && (
            <span className="absolute -bottom-[3px] left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
      </Tooltip>
    );
  },
);

/* -------------------------------------------------------------- Tooltip */

interface TooltipProps {
  label: string;
  kbd?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export function Tooltip({ label, kbd, side = 'bottom', children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();

  const pos =
    side === 'bottom'
      ? 'top-full mt-2 left-1/2 -translate-x-1/2'
      : side === 'top'
        ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
        : side === 'left'
          ? 'right-full mr-2 top-1/2 -translate-y-1/2'
          : 'left-full ml-2 top-1/2 -translate-y-1/2';

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => {
        timer.current = window.setTimeout(() => setOpen(true), 450);
      }}
      onMouseLeave={() => {
        window.clearTimeout(timer.current);
        setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <fm.span
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: motionTokens.duration.instant, ease: EASE }}
            role="tooltip"
            className={cx(
              'pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-sidebar-surface px-2 py-1 text-2xs font-medium text-white shadow-elevation-2',
              pos,
            )}
          >
            {label}
            {kbd && (
              <kbd className="rounded-[3px] border border-sidebar-border-strong bg-sidebar-bg px-1 font-mono text-[9px] text-sidebar-dim">
                {kbd}
              </kbd>
            )}
          </fm.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------ Separator */

export function Separator({ vertical = false }: { vertical?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx('block bg-border', vertical ? 'h-5 w-px' : 'h-px w-full')}
    />
  );
}

/* ---------------------------------------------------------- GlassPanel */

export function GlassPanel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-lg border border-border/70 bg-glass shadow-elevation-3 backdrop-blur-xl',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- Toggle */

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

/** iOS-style switch — accent track when on. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-surface3 border border-border-strong',
      )}
    >
      <span
        className={cx(
          'absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-white shadow-elevation-1 transition-all duration-200',
          checked ? 'left-[19px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------- Dropdown */

interface DropdownProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string; icon?: IconName }>;
  onChange: (v: T) => void;
  label: string;
  buttonClassName?: string;
  compact?: boolean;
  /** Where the menu opens; use 'up' near the bottom edge of a clipped container. */
  direction?: 'down' | 'up';
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  buttonClassName,
  compact = false,
  direction = 'down',
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface3 hover:text-text-primary',
          open && 'bg-surface3 text-text-primary',
          buttonClassName,
        )}
      >
        {current?.icon && <Icon name={current.icon} size="sm" />}
        {!compact && <span>{current?.label}</span>}
        <Icon name="chevronDown" size={12} className={cx('transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <fm.ul
            initial={{ opacity: 0, y: direction === 'up' ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'up' ? 4 : -4, scale: 0.98 }}
            transition={{ duration: motionTokens.duration.fast, ease: EASE }}
            role="listbox"
            aria-label={label}
            className={cx(
              'absolute right-0 z-50 min-w-[160px] overflow-hidden rounded-md border border-border bg-surface2 p-1 shadow-elevation-3',
              direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            )}
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors',
                    o.value === value
                      ? 'bg-accent-muted text-accent-bright'
                      : 'text-text-secondary hover:bg-surface3 hover:text-text-primary',
                  )}
                >
                  {o.icon && <Icon name={o.icon} size="sm" />}
                  {o.label}
                </button>
              </li>
            ))}
          </fm.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------- Slider */

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}

export function Slider({ value, min = 0, max = 1, step = 0.01, onChange, label, className }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className={cx('timeline w-full', className)}
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ ['--fill' as string]: `${fill}%` }}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
}
