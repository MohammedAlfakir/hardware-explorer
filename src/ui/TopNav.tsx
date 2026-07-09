'use client';

import Link from 'next/link';
import { useHardwareStore } from '@/state/useHardwareStore';
import { Icon } from './icons';

/** Top navigation — HardwareLab wordmark (links home), account avatar. */
export function TopNav() {
  const setSidebarOpen = useHardwareStore((s) => s.setSidebarOpen);

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface1 px-4 tablet:px-7">
      {/* Mobile drawer trigger */}
      <button
        type="button"
        aria-label="Open hardware library"
        onClick={() => setSidebarOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-surface2 hover:text-text-primary tablet-lg:hidden"
      >
        <Icon name="menu" size="lg" />
      </button>

      <Link href="/" className="text-lg font-extrabold tracking-tight text-text-primary">
        HARDWARE<span className="text-accent">LAB</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Account"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-bg text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Icon name="user" size="md" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-surface1 bg-accent" />
        </button>
      </div>
    </header>
  );
}
