'use client';

import { motion as fm } from 'framer-motion';
import { useActiveHardware } from '@/state/useHardwareStore';
import { motion as motionTokens } from '@/design/tokens';
import { Icon, type IconName } from './icons';

/** The four headline stat cards beneath the viewport (TYPE, cores, memory, …). */
export function StatCards() {
  const hardware = useActiveHardware();

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 mobile:grid-cols-2 laptop:grid-cols-4">
      {hardware.highlights.map((stat, i) => (
        <fm.div
          key={`${hardware.id}:${stat.label}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionTokens.duration.base,
            ease: motionTokens.ease.out,
            delay: i * 0.05,
          }}
          className="flex items-center gap-4 rounded-xl border border-border bg-surface1 p-5 shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Icon name={stat.icon as IconName} size="xl" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
              {stat.label}
            </span>
            <span className="mt-0.5 block truncate text-lg font-bold text-text-primary">
              {stat.value}
            </span>
          </span>
        </fm.div>
      ))}
    </div>
  );
}
