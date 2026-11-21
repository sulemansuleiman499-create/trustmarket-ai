"use client";

import { useState } from "react";
import { useWallet } from "./wallet-provider";

/**
 * Real wallet connection via the Concordium browser wallet extension
 * (window.concordium API). Keys and recovery phrases stay inside the
 * wallet — the dashboard only ever receives the connected account
 * address.
 */
export function WalletButton({ variant }: { variant: "sidebar" | "topbar" }) {
  const { account, connectState, connect, disconnect } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  const noticeText =
    !account && !dismissed
      ? connectState === "missing-extension"
        ? "Concordium browser wallet extension not detected. Install the wallet to connect an account, or continue with the recorded owner account."
        : connectState === "rejected"
          ? "The connection request was rejected or cancelled in the wallet. Nothing was connected."
          : null
      : null;

  if (account) {
    const label = `${account.slice(0, 6)}…${account.slice(-4)}`;
    const title = `${account} — click to disconnect`;
    const classes =
      variant === "sidebar"
        ? "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-left text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-raised"
        : "rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-raised";
    return (
      <button type="button" onClick={disconnect} title={title} className={classes}>
        {variant === "sidebar" ? (
          <span className="mb-0.5 block text-[10px] font-normal tracking-wide text-ink-muted uppercase">
            Connected
          </span>
        ) : null}
        <span className="block truncate font-mono text-[12px] text-ink">
          {label}
        </span>
      </button>
    );
  }

  const busy = connectState === "connecting";
  const classes =
    variant === "sidebar"
      ? "w-full rounded-lg border border-accent/30 bg-accent-muted px-3 py-2 text-xs font-medium text-accent-hover transition-colors hover:bg-accent/20 disabled:opacity-50"
      : "rounded-lg border border-accent/30 bg-accent-muted px-3 py-1.5 text-xs font-medium text-accent-hover transition-colors hover:bg-accent/20 disabled:opacity-50";

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          void connect();
        }}
        disabled={busy}
        className={classes}
      >
        {busy ? "Connecting…" : "Connect wallet"}
      </button>
      {noticeText ? (
        <div className="absolute right-0 bottom-full z-10 mb-2 w-64 rounded-lg border border-line bg-overlay p-3 text-xs leading-5 text-ink-secondary shadow-2xl lg:right-0">
          <p>{noticeText}</p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-2 text-[11px] font-medium text-accent-hover hover:text-accent"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
