"use client";

import Link from "next/link";
import { AnimatePresence, motion as fm } from "framer-motion";
import { HARDWARE_LIST } from "@/hardware/registry";
import { useHardwareStore } from "@/state/useHardwareStore";
import { motion as motionTokens } from "@/design/tokens";
import { Icon } from "./icons";
import { cx } from "./primitives";
import { HardwareThumb } from "./thumbs";

/** HardwareLab wordmark + tagline — links back to the landing page. */
function Brand() {
  return (
    <div className="shrink-0 px-6 pb-6 pt-7">
      <Link href="/" className="inline-block text-2xl font-extrabold leading-none tracking-tight">
        <span className="text-sidebar-text">HARDWARE</span>
        <span className="text-accent">LAB</span>
      </Link>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.28em] text-sidebar-dim">
        Learn. Explore. Compute.
      </p>
    </div>
  );
}

function ModelList() {
  const activeId = useHardwareStore(s => s.activeHardwareId);
  const setActive = useHardwareStore(s => s.setActiveHardware);
  const setSidebarOpen = useHardwareStore(s => s.setSidebarOpen);

  return (
    <div className="scrollbar-dark flex-1 overflow-y-auto px-4 pb-4">
      <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
        Hardware Models
      </h3>
      <ul className="flex flex-col gap-2.5" role="list">
        {HARDWARE_LIST.map(hw => {
          const active = hw.id === activeId;
          return (
            <li key={hw.id}>
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  setActive(hw.id);
                  setSidebarOpen(false);
                }}
                className={cx(
                  "group flex w-full items-center gap-3.5 rounded-lg border p-2.5 text-left transition-all duration-200",
                  active
                    ? "border-accent bg-sidebar-hover shadow-[0_0_0_1px_rgba(246,130,31,0.25),0_8px_24px_rgba(0,0,0,0.35)]"
                    : "border-sidebar-border bg-sidebar-surface hover:border-sidebar-border-strong hover:bg-sidebar-hover",
                )}
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
                  <HardwareThumb id={hw.id} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-sidebar-text">
                  {hw.shortName}
                </span>
                <Icon
                  name="chevronRight"
                  size={14}
                  className={cx(
                    "shrink-0 transition-all duration-200",
                    active
                      ? "text-accent"
                      : "text-sidebar-dim group-hover:translate-x-0.5 group-hover:text-sidebar-text",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PortfolioLink() {
  return (
    <div className="shrink-0 px-2 pb-5 pt-2">
      <a
        href="https://www.mohammedalfakir.site/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-surface px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-sidebar-text transition-colors hover:border-sidebar-border-strong hover:bg-sidebar-hover"
      >
        Made by Mohammed Alfakir
        <Icon name="chevronRight" size="sm" className="text-sidebar-dim" />
      </a>
    </div>
  );
}

function SidebarBody() {
  return (
    <>
      <Brand />
      <ModelList />
      <PortfolioLink />
    </>
  );
}

/** Sidebar — persistent charcoal rail on desktop, animated drawer below lg. */
export function Sidebar() {
  const open = useHardwareStore(s => s.sidebarOpen);
  const setOpen = useHardwareStore(s => s.setSidebarOpen);

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label="Hardware library"
        className="hidden w-[288px] shrink-0 flex-col bg-sidebar-bg tablet-lg:flex"
      >
        <SidebarBody />
      </aside>

      {/* Mobile / tablet drawer */}
      <AnimatePresence>
        {open && (
          <>
            <fm.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionTokens.duration.fast }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] tablet-lg:hidden"
              aria-hidden
            />
            <fm.aside
              key="drawer"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{
                duration: motionTokens.duration.base,
                ease: motionTokens.ease.out,
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Hardware library"
              className="fixed inset-y-0 left-0 z-40 flex w-[288px] flex-col bg-sidebar-bg shadow-elevation-3 tablet-lg:hidden"
            >
              <SidebarBody />
            </fm.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
