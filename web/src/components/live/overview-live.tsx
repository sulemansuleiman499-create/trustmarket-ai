"use client";

import { useLive } from "./use-live";
import type {
  BadgeCheckPayload,
  IndexerEventList,
  IndexerStatus,
  NormalizedBadgeVerdict,
} from "@/lib/concordium/live-types";
import { OWN_AGENT } from "@/lib/concordium/constants";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const PulseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3.5 12h4l2.5-7 4 14 2.5-7h4" />
  </svg>
);

/**
 * Live overview stats and registry activity, sourced from the hosted
 * Agent Registry Indexer. All values are real chain-derived data.
 */
export function OverviewLive() {
  const status = useLive<IndexerStatus>("/api/registry/status");
  const events = useLive<IndexerEventList>("/api/registry/events?limit=6");
  const badge = useLive<BadgeCheckPayload>(
    `/api/registry/badge-check/${OWN_AGENT.tokenId}`,
  );

  const testnet = status.data?.networks.testnet;
  const statsReady = !status.loading && !status.error && testnet;

  const badgeState = badge.data
    ? {
        label: badge.data.kind === "badge" && badge.data.badge.badgeValid ? "Valid" : "Not valid",
        detail:
          badge.data.kind === "badge"
            ? badge.data.badge.badgeValid
              ? "All badge checks passed in the latest live verification."
              : summarizeIssues(badge.data.badge)
            : "Unexpected response shape from badge-check.",
      }
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        stat={{
          label: "Registry agents · testnet",
          value: testnet ? testnet.agents.toLocaleString("en-US") : "…",
          footnote: status.loading
            ? "Reading the hosted Agent Registry Indexer…"
            : status.error
              ? `Registry unavailable: ${status.error}`
              : `Synced to block ${testnet?.sync_height?.toLocaleString("en-US") ?? "…"} · lag ${testnet?.lag_blocks ?? "…"} blocks`,
        }}
      />
      <StatCard
        stat={{
          label: "Registry events indexed",
          value: testnet ? testnet.agent_events.toLocaleString("en-US") : "…",
          footnote: statsReady
            ? `Indexer last synced ${formatTime(testnet?.last_synced_at)}`
            : "Waiting for indexer status…",
        }}
      />
      <StatCard
        stat={{
          label: "Official agent badge",
          value: badgeState ? badgeState.label : "…",
          footnote: badge.loading
            ? "Running the live badge check against the registry service…"
            : badge.error
              ? `Badge check unavailable: ${badge.error}`
              : (badgeState?.detail ?? ""),
        }}
      />
      <StatCard
        stat={{
          label: "x402 payments",
          value: 0,
          footnote:
            "Execution requires wallet signing and a facilitator; no payment rail is wired in this keyless dashboard.",
        }}
      />

      <div className="sm:col-span-2 xl:col-span-4">
        <Card>
          <CardHeader
            title="Live registry activity"
            subtitle="Most recent Agent Registry events on testnet (real on-chain events)"
            action={
              <Badge tone="success" dot>
                Live · indexer
              </Badge>
            }
          />
          <CardBody className="p-0">
            {events.loading ? (
              <LoadingRows />
            ) : events.error ? (
              <ErrorNote message={events.error} />
            ) : !events.data || events.data.events.length === 0 ? (
              <EmptyState
                icon={PulseIcon}
                title="No registry events reported"
                description="The indexer returned no recent events for testnet."
              />
            ) : (
              <ul className="divide-y divide-line">
                {events.data.events.map((e, i) => (
                  <li
                    key={`${e.tx_hash}-${e.event_index}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge tone={e.event_name === "Registered" ? "success" : e.event_name === "Revoked" ? "danger" : "neutral"} dot>
                        {e.event_name}
                      </Badge>
                      <span className="text-sm text-ink">
                        Agent #{e.token_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="hidden font-mono sm:inline">
                        tx {e.tx_hash.slice(0, 10)}…
                      </span>
                      <span>block {e.block_height.toLocaleString("en-US")}</span>
                      <span>{formatTime(e.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-8 animate-pulse rounded-md bg-surface-raised" />
      ))}
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      <Badge tone="danger" dot>
        Registry unavailable
      </Badge>
      <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">{message}</p>
    </div>
  );
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "…";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function summarizeIssues(badge: NormalizedBadgeVerdict): string {
  const first = badge.issues.find((i) => i.severity === "error") ?? badge.issues[0];
  if (first) {
    const suffix =
      badge.checks.on_chain_agent_found && badge.checks.status_active
        ? " Registration is on chain and Active."
        : "";
    return `Live verdict: ${first.message}.${suffix}`;
  }
  return "Live verdict: badge check did not pass.";
}
