"use client";

import { useState } from "react";
import { useLive } from "./use-live";
import type { IndexerAgentList } from "@/lib/concordium/live-types";
import { TableShell, THead, Th, Tr, Td } from "@/components/ui/table";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody } from "@/components/ui/card";

const PAGE_SIZE = 10;

const RegistryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M16 19v-1a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v1M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11.5a3 3 0 1 0 0-6M21 19v-1a3 3 0 0 0-2.4-2.94" />
  </svg>
);

/**
 * Live Agent Directory over the hosted registry. Every row is a real
 * on-chain registration; nothing is simulated.
 */
export function DirectoryTable() {
  const [offset, setOffset] = useState(0);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerParam, setOwnerParam] = useState<string | null>(null);

  const url = `/api/registry/agents?limit=${PAGE_SIZE}&offset=${offset}${
    ownerParam ? `&owner=${encodeURIComponent(ownerParam)}` : ""
  }`;
  const { data, error, loading, reload } = useLive<IndexerAgentList>(url);

  const total = data?.total ?? null;
  const agents = data?.agents ?? [];

  const applyOwner = () => {
    setOffset(0);
    setOwnerParam(ownerQuery.trim() || null);
  };

  return (
    <>
      <Card className="mb-4 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              Filter by owner account
            </span>
            <input
              type="text"
              value={ownerQuery}
              onChange={(e) => setOwnerQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyOwner();
              }}
              placeholder="Concordium account address…"
              className="w-full rounded-lg border border-line bg-code px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-muted focus:border-accent/50 focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyOwner}
              className="rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover transition-colors hover:bg-accent/20"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setOwnerQuery("");
                setOwnerParam(null);
                setOffset(0);
              }}
              className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-raised"
            >
              Clear
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : agents.length === 0 ? (
        <EmptyState
          icon={RegistryIcon}
          title="No agents match"
          description="No registered agents were returned for this page or owner filter. Adjust the filter or page back."
        />
      ) : (
        <>
          <TableShell>
            <THead>
              <Th>Agent</Th>
              <Th>Owner account</Th>
              <Th>Agent Card</Th>
              <Th>Status</Th>
              <Th>Registered (UTC)</Th>
              <Th>Block</Th>
            </THead>
            <tbody>
              {agents.map((agent) => (
                <Tr key={agent.token_id}>
                  <Td emphasis>
                    <span className="font-mono">#{agent.token_id}</span>
                  </Td>
                  <Td>
                    <code className="font-mono text-[12px]">
                      {truncate(agent.owner_account, 14)}
                    </code>
                  </Td>
                  <Td>
                    {agent.agent_uri ? (
                      <a
                        href={agent.agent_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-accent-hover hover:text-accent"
                      >
                        Card URI ↗
                      </a>
                    ) : (
                      <span className="text-xs text-ink-muted">Not pinned</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={agent.status} />
                  </Td>
                  <Td className="whitespace-nowrap">{formatUtc(agent.registered_at)}</Td>
                  <Td className="tabular-nums">
                    {agent.last_event_block.toLocaleString("en-US")}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableShell>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">
              {ownerParam ? "Filtered view · " : ""}
              {total !== null
                ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total.toLocaleString("en-US")} registered agents (live)`
                : "Live registry data"}
            </p>
            <div className="flex gap-2">
              <PagerButton
                label="Previous"
                disabled={offset === 0 || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              />
              <PagerButton
                label="Next"
                disabled={total === null || offset + PAGE_SIZE >= total || loading}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "Active" ? "success" : status === "Revoked" ? "danger" : "neutral";
  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function LoadingBlock() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-surface" />
      ))}
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center py-10 text-center">
        <Badge tone="danger" dot>
          Registry unavailable
        </Badge>
        <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
        >
          Retry
        </button>
      </CardBody>
    </Card>
  );
}

function truncate(value: string, head: number) {
  return value.length <= head + 6
    ? value
    : `${value.slice(0, head)}…${value.slice(-4)}`;
}

function formatUtc(iso: string) {
  return iso.replace("T", " ").slice(0, 16);
}
