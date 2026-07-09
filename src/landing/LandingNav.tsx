'use client';

import Link from 'next/link';
import { HARDWARE_LIST } from '@/hardware/registry';
import { Icon } from '@/ui/icons';

/** Fixed landing navigation — logo, model deep links, workspace CTA. */
export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-6 tablet:px-10">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-text-primary">
          HARD<span className="text-accent">LAB</span>
        </Link>

        <nav aria-label="Models" className="ml-auto hidden items-center gap-6 laptop:flex">
          {HARDWARE_LIST.map((hw) => (
            <Link
              key={hw.id}
              href={`/explorer?model=${hw.id}`}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {hw.shortName}
            </Link>
          ))}
        </nav>

        <Link
          href="/explorer"
          className="group ml-auto flex items-center gap-2 rounded-full bg-sidebar-bg px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-accent laptop:ml-0"
        >
          Workspace
          <Icon name="chevronRight" size={12} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
