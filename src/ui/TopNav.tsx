'use client';

import { useHardwareStore } from '@/state/useHardwareStore';
import { Icon } from './icons';
import { cx } from './primitives';

const NAV_LINKS = ['Explore', 'Library', 'Lessons', 'About'] as const;

/** Top navigation — section label, primary links, account avatar. */
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

      <span className="truncate text-xs font-bold uppercase tracking-[0.22em] text-text-primary">
        Interactive 3D Hardware
      </span>

      <nav aria-label="Primary" className="ml-auto hidden items-center gap-7 tablet:flex">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link}
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-current={i === 0 ? 'page' : undefined}
            className={cx(
              'text-sm font-medium transition-colors',
              i === 0
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="ml-4 flex items-center gap-3 border-l border-border pl-4 tablet:ml-6 tablet:pl-6">
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
