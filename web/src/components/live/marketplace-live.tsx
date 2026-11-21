"use client";

import { useRef, useState } from "react";
import { useLive } from "./use-live";
import { HireFlow } from "./hire-flow";
import type { HireGateState } from "./hire-flow";
import type {
  MarketplaceCardsPayload,
  MarketplaceListing,
  TrustGateResult,
} from "@/lib/concordium/live-types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const StoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 9.5 5.2 4h13.6L20 9.5M4 9.5v9A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-9M4 9.5c0 1.2 1 2.2 2.25 2.2S8.5 10.7 8.5 9.5c0 1.2 1 2.2 2.25 2.2s2.25-1 2.25-2.2c0 1.2 1 2.2 2.25 2.2s2.25-1 2.25-2.2c0 1.2 1 2.2 2.25 2.2S20 10.7 20 9.5M9.5 20v-5h5v5" />
  </svg>
);

/**
 * Real marketplace listings: services published by Active testnet
 * agents in their Agent Cards, discovered live and hash-checked
 * server-side against the on-chain anchor.
 *
 * No listing can be hired on the strength of its card alone: pressing
 * "Verify & hire" opens the two-step flow, which runs the live
 * Concordium badge gate before any payment step exists. The pinned
 * demo seller is a real Active agent with a clearly labelled sample
 * service, used to demonstrate the verified checkout path.
 */
export function MarketplaceLive() {
  const [offset, setOffset] = useState(0);
  const [active, setActive] = useState<MarketplaceListing | null>(null);
  const [gate, setGate] = useState<HireGateState>({ kind: "verifying" });
  const abortRef = useRef<AbortController | null>(null);
  const { data, error, loading, reload } = useLive<MarketplaceCardsPayload>(
    `/api/marketplace/cards?offset=${offset}`,
  );

  const runGate = async (listing: MarketplaceListing) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGate({ kind: "verifying" });

    try {
      const res = await fetch(
        `/api/verification/gate?owner=${encodeURIComponent(listing.ownerAccount)}&tokenId=${listing.tokenId}`,
        {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        },
      );
      const body = (await res.json().catch(() => null)) as
        | TrustGateResult
        | { error?: string }
        | null;
      if (controller.signal.aborted) return;
      if (!res.ok || !body || !("decision" in body)) {
        setGate({
          kind: "error",
          message:
            (body && "error" in body && body.error) ||
            `Verification request failed (HTTP ${res.status}). Commerce stays blocked.`,
        });
        return;
      }
      setGate(
        body.decision === "allow"
          ? { kind: "verified", result: body }
          : { kind: "blocked", result: body },
      );
    } catch {
      if (controller.signal.aborted) return;
      setGate({
        kind: "error",
        message:
          "Could not reach the verification service. The gate fails closed, so commerce is blocked.",
      });
    }
  };

  const openHire = (listing: MarketplaceListing) => {
    setActive(listing);
    void runGate(listing);
  };

  const closeHire = () => {
    abortRef.current?.abort();
    setActive(null);
  };

  const retryGate = () => {
    if (active) void runGate(active);
  };

  const scanNext = () => {
    if (!data) return;
    const nextWindow = data.windowOffset + data.scanned;
    if (nextWindow < data.windowTotal) setOffset(nextWindow);
    else setOffset(0);
  };

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardBody className="flex flex-col items-center py-10 text-center">
            <Badge tone="danger" dot>
              Discovery unavailable
            </Badge>
            <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
            >
              Retry
            </button>
          </CardBody>
        </Card>
      ) : !data ||
        (data.reachable.length === 0 && data.demoSellers.length === 0) ? (
        <EmptyState
          icon={StoreIcon}
          title="No reachable Agent Cards in this window"
          description="Active testnet agents were scanned, but none of the Agent Cards in this scan window could be fetched and parsed. Try the next window."
          hint={
            data
              ? `Scanned ${data.examined} agents with pinned cards of ${data.withCardUri} in this window; ${data.unreachable} card fetches failed.`
              : undefined
          }
          action={
            data ? (
              <button
                type="button"
                onClick={scanNext}
                className="rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
              >
                Scan next window
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              {data.reachable.length} live listing
              {data.reachable.length === 1 ? "" : "s"}
              {data.demoSellers.length > 0
                ? ` · ${data.demoSellers.length} demo seller`
                : ""}{" "}
              · {data.examined} agents with pinned cards examined ·{" "}
              {data.unreachable} unreachable card
              {data.unreachable === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={scanNext}
              className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-raised"
            >
              Scan next window
            </button>
          </div>
          {data.demoSellers.length > 0 ? (
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent-muted/40 px-3.5 py-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-hover" aria-hidden />
              <p className="text-[11px] leading-5 text-ink-secondary">
                <span className="font-medium text-ink">
                  Start with the pinned demo seller
                </span>{" "}
                to walk the full verify → payment flow. Its service is labelled
                demo; the badge check is live. Live listings below show the
                blocked outcome when a seller&apos;s badge is not valid.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...data.demoSellers, ...data.reachable].map((listing) => (
              <ListingCard
                key={`${listing.demo ? "demo" : "live"}-${listing.tokenId}-${listing.agentUri}`}
                listing={listing}
                onHire={() => openHire(listing)}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-ink-muted">
            The demo seller is a real Active testnet agent. Only its service is
            labelled demo; the badge, hash and ownership checks run live when
            you press Verify &amp; hire.
          </p>
        </>
      )}

      {active ? (
        <HireFlow
          key={`${active.tokenId}-${active.agentUri}`}
          listing={active}
          gate={gate}
          onRetry={retryGate}
          onClose={closeHire}
        />
      ) : null}
    </>
  );
}

function ListingCard({
  listing,
  onHire,
}: {
  listing: MarketplaceListing;
  onHire: () => void;
}) {
  return (
    <Card className={`flex flex-col ${listing.demo ? "ring-1 ring-accent/20" : ""}`}>
      <CardHeader
        title={listing.name}
        subtitle={listing.provider ? `Provider: ${listing.provider}` : undefined}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {listing.demo ? <Badge tone="accent">Demo seller</Badge> : null}
            <Badge tone={listing.cardHashMatches ? "success" : "warning"} dot>
              {listing.cardHashMatches ? "Card hash verified" : "Hash mismatch"}
            </Badge>
          </div>
        }
      />
      <CardBody className="flex flex-1 flex-col">
        {listing.description ? (
          <p className="line-clamp-3 text-sm leading-6 text-ink-secondary">
            {listing.description}
          </p>
        ) : null}

        {listing.services.length > 0 ? (
          <div className="mt-3">
            <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
              Services
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {listing.services.slice(0, 3).map((service, i) => (
                <li
                  key={`${service.name}-${i}`}
                  className="rounded-lg border border-line bg-surface-raised/40 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-ink">{service.name}</p>
                    <span className="shrink-0 text-[11px] font-medium text-ink-secondary">
                      {service.price
                        ? `${service.price.amount} ${service.price.currency}`
                        : "x402 quote"}
                    </span>
                  </div>
                  {service.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-ink-muted">
                      {service.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {listing.services.length > 3 ? (
              <p className="mt-1 text-[10px] text-ink-muted">
                +{listing.services.length - 3} more in the hire flow
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-[11px] leading-5 text-ink-muted">
            No priced services published in the Agent Card — the seller quotes
            through x402 after verification.
          </p>
        )}

        {listing.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="rounded-md border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-muted"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-[11px] leading-5 text-ink-muted">
          Agent <span className="font-mono">#{listing.tokenId}</span> · registered{" "}
          {listing.registeredAt.slice(0, 10)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <a
            href={listing.agentUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent-hover hover:text-accent"
          >
            Agent Card ↗
          </a>
          <button
            type="button"
            onClick={onHire}
            className="rounded-lg border border-accent/30 bg-accent-muted px-3 py-1.5 text-xs font-medium text-accent-hover transition-colors hover:bg-accent/20"
          >
            Verify &amp; hire
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
