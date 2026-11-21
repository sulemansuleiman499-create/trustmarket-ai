"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { NAV_GROUPS, TOPBAR_LINKS } from "@/lib/navigation";
import { WalletProvider } from "./wallet-provider";
import { WalletButton } from "./wallet-button";

/**
 * Client-side dashboard shell: fixed sidebar on desktop, collapsible
 * drawer + topbar on mobile. Page content is rendered on the server and
 * passed through as children.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const closeMobile = () => setMobileOpen(false);

  const sidebar = (
    <Sidebar activeHref={pathname} onAfterNavigate={closeMobile} />
  );

  return (
    <WalletProvider>
    <div className="h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-canvas lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-canvas shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* Content column */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar activeHref={pathname} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-4 sm:px-6 lg:px-10">
          <p className="mx-auto max-w-6xl text-xs text-ink-muted">
            TrustMarket AI · Concordium Trusted Agents Hackathon — live reads
            from the Concordium Agent Registry (hosted Indexer + MCP service).
            x402 payment execution requires wallet signing and is not wired.
          </p>
        </footer>
      </div>
    </div>
    </WalletProvider>
  );
}

function Sidebar({
  activeHref,
  onAfterNavigate,
}: {
  activeHref: string;
  onAfterNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-muted text-sm font-bold tracking-tight text-accent-hover">
          TM
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            TrustMarket AI
          </p>
          <p className="text-[11px] text-ink-muted">Trusted agent commerce</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-2 pb-2 text-[10px] font-medium tracking-widest text-ink-muted uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeHref === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onAfterNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                        active
                          ? "bg-accent-muted text-ink"
                          : "text-ink-secondary hover:bg-white/[0.03] hover:text-ink"
                      }`}
                    >
                      <Icon
                        aria-hidden
                        className={`size-4 shrink-0 ${
                          active ? "text-accent-hover" : "text-ink-muted"
                        }`}
                      />
                      <span className="truncate font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <span className="size-1.5 shrink-0 rounded-full bg-warning" />
          <div className="min-w-0 text-[11px] leading-4">
            <p className="font-medium text-ink-secondary">
              Concordium Testnet
            </p>
            <p className="text-ink-muted">Genesis 4221…0f27</p>
          </div>
        </div>
        <WalletButton variant="sidebar" />
      </div>
    </div>
  );
}

function Topbar({
  activeHref,
  onMenu,
}: {
  activeHref: string;
  onMenu: () => void;
}) {
  const current = TOPBAR_LINKS.find((i) => i.href === activeHref);
  const currentIcon = current ? current.label : "Dashboard";
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile logo — sidebar is hidden */}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-muted text-xs font-bold text-accent-hover lg:hidden">
          TM
        </span>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenu}
          className="flex size-9 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-white/[0.03] lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4.5" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="hidden truncate text-sm font-medium text-ink-secondary lg:block">
          {currentIcon}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="hidden items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-secondary sm:inline-flex">
          <span className="size-1.5 rounded-full bg-warning" />
          Concordium Testnet
        </span>
        <WalletButton variant="topbar" />
      </div>
    </header>
  );
}
