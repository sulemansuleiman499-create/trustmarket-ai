"use client";

import { useLive } from "./use-live";
import { HashComparison, VerificationCheckList } from "./verification-checks";
import type { BadgeCheckPayload, NormalizedBadgeVerdict } from "@/lib/concordium/live-types";
import { CONCORDIUM_TESTNET, OWN_AGENT } from "@/lib/concordium/constants";
import { checksFromVerdict } from "@/lib/concordium/verdict";
import { useWallet } from "@/components/layout/wallet-provider";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, ValueLine } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const AgentIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M6 20V9.5L12 4l6 5.5V20M10.5 20v-4.5h3V20M4 20h16M12 8.5v.01" />
  </svg>
);

/**
 * Live "My Agents": resolves the agents owned by the connected wallet
 * (or the recorded owner account as a fallback) directly from the
 * registry, together with each agent's real badge verdict.
 */
export function MyAgentsLive() {
  const { lookupAccount, isFallback } = useWallet();
  const badge = useLive<BadgeCheckPayload>(
    `/api/registry/badge-check/${encodeURIComponent(lookupAccount)}`,
  );

  if (badge.loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <div className="h-10 animate-pulse rounded-lg bg-surface" />
        <div className="h-48 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (badge.error) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-10 text-center">
          <Badge tone="danger" dot>
            Registry unavailable
          </Badge>
          <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">
            {badge.error}
          </p>
          <button
            type="button"
            onClick={badge.reload}
            className="mt-4 rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
          >
            Retry
          </button>
        </CardBody>
      </Card>
    );
  }

  const agents = badge.data && badge.data.kind === "account" ? badge.data.agents : [];
  const summary = badge.data && badge.data.kind === "account" ? badge.data.summary : null;

  return (
    <>
      <p className="mb-4 text-xs text-ink-muted">
        Ownership resolved live from the Agent Registry for{" "}
        <code className="font-mono text-[11px] text-ink-secondary">
          {truncate(lookupAccount)}
        </code>
        {isFallback
          ? " (recorded owner account — no wallet connected)."
          : " (connected Concordium wallet)."}
      </p>

      {agents.length === 0 ? (
        <EmptyState
          icon={AgentIcon}
          title="No agents owned by this account"
          description="The registry reports no CIS-8004 agent registrations for this Concordium account."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {agents.map((agent) => (
            <OwnedAgentCard key={agent.tokenId} agent={agent} />
          ))}
          {summary ? (
            <p className="text-xs text-ink-muted">
              Live summary for{" "}
              <code className="font-mono text-[11px] text-ink-secondary">
                {badge.data && badge.data.kind === "account" ? badge.data.account : ""}
              </code>
              : {summary.valid} valid badge{summary.valid === 1 ? "" : "s"} of{" "}
              {summary.valid + summary.invalid} owned.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}

function OwnedAgentCard({ agent }: { agent: NormalizedBadgeVerdict }) {
  const isOfficial = agent.tokenId === OWN_AGENT.agentNumber;

  return (
    <Card>
      <CardHeader
        title={`Agent #${agent.tokenId}`}
        subtitle={
          isOfficial
            ? "Official TrustMarket agent · live registry record"
            : "Live registry record"
        }
        action={
          <div className="flex items-center gap-2">
            {isOfficial ? <Badge tone="accent">Official</Badge> : null}
            <BadgeVerdictBadge badgeValid={agent.badgeValid} />
          </div>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-2">
          <dl className="flex flex-col gap-5">
            <Field label="Agent number">
              <span className="font-mono text-lg font-semibold text-ink">
                {agent.tokenId}
              </span>
            </Field>
            <Field label="Token address (badge, short form)">
              <ValueLine>{agent.tokenAddress}</ValueLine>
            </Field>
            <Field label="Canonical Agent ID">
              <ValueLine>
                {`ccd:${CONCORDIUM_TESTNET.genesisHash}/cis-2:${agent.tokenAddress}`}
              </ValueLine>
            </Field>
          </dl>
          <dl className="flex flex-col gap-5">
            <Field label="Owner wallet (chain)">
              <ValueLine>{agent.onChain.owner_account}</ValueLine>
            </Field>
            <Field
              label="Agent Card URI"
              hint={
                agent.agentUri
                  ? "Hosted at agent_uri — hash-verifiable."
                  : "Not pinned on chain. The badge cannot pass until the owner sets an Agent Card URI + hash."
              }
            >
              {agent.agentUri ? (
                <ValueLine>{agent.agentUri}</ValueLine>
              ) : (
                <span className="text-xs text-warning">Not pinned — verification pending</span>
              )}
            </Field>
            <Field label="Served card SHA-256">
              <ValueLine>{agent.cardSha256 ?? "—"}</ValueLine>
            </Field>
            <Field label="On-chain metadata hash">
              <ValueLine>{agent.onChain.metadata_hash_hex ?? "—"}</ValueLine>
            </Field>
          </dl>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-raised/50 px-4 py-3.5">
            <p className="mb-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
              Registration status (live)
            </p>
            <Badge tone={agent.onChain.status === "Active" ? "success" : "danger"} dot>
              {agent.onChain.status}
            </Badge>
          </div>
          <div className="rounded-lg border border-line bg-surface-raised/50 px-4 py-3.5">
            <p className="mb-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
              Badge status (live)
            </p>
            <div className="flex items-center gap-2">
              <BadgeVerdictBadge badgeValid={agent.badgeValid} />
              <span className="text-xs text-ink-muted">
                {agent.badgeValid
                  ? "All checks passed."
                  : (agent.issues[0]?.message ?? "Checks did not pass.")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-xs font-medium tracking-wide text-ink-muted uppercase">
            Verification checks (live)
          </p>
          <HashComparison
            served={agent.cardSha256}
            onChain={agent.onChain.metadata_hash_hex}
          />
          <div className="mt-4">
            <VerificationCheckList checks={checksFromVerdict(agent)} dense />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function BadgeVerdictBadge({ badgeValid }: { badgeValid: boolean }) {
  return badgeValid ? (
    <Badge tone="success" dot>
      Verified
    </Badge>
  ) : (
    <Badge tone="warning" dot>
      Not yet verified
    </Badge>
  );
}

function truncate(value: string) {
  return value.length <= 22 ? value : `${value.slice(0, 14)}…${value.slice(-4)}`;
}
