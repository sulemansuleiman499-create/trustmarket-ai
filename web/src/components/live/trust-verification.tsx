"use client";

import { useLive } from "./use-live";
import type { BadgeCheckPayload, NormalizedBadgeVerdict } from "@/lib/concordium/live-types";
import { OWN_AGENT } from "@/lib/concordium/constants";
import { useWallet } from "@/components/layout/wallet-provider";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, ValueLine } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { BadgeVerdictBadge } from "./my-agents-live";
import { HashComparison, VerificationCheckList } from "./verification-checks";
import { checksFromVerdict } from "@/lib/concordium/verdict";
import { EmptyState } from "@/components/ui/empty-state";

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Zm-2.7 8.3 2 2 3.4-3.9" />
  </svg>
);

/**
 * Live Trust & Verification panel. Runs the real trustless badge check
 * (registry resolution + Agent Card hash comparison) against the hosted
 * registry service, for our own badge and for the account in context.
 * A badge is only ever displayed "Verified" when the live verdict
 * says badge_valid.
 */
export function TrustVerificationPanel() {
  const { lookupAccount, isFallback } = useWallet();
  const ownBadge = useLive<BadgeCheckPayload>(
    `/api/registry/badge-check/${OWN_AGENT.tokenId}`,
  );
  const accountCheck = useLive<BadgeCheckPayload>(
    `/api/registry/badge-check/${encodeURIComponent(lookupAccount)}`,
  );

  return (
    <>
      <Card>
        <CardHeader
          title={`Live badge verification — Agent #${OWN_AGENT.agentNumber}`}
          subtitle="Trustless check against the Concordium registry: on-chain resolution + card hash comparison"
          action={<VerdictAction state={stateOf(ownBadge)} valid={ownBadge.data?.kind === "badge" ? ownBadge.data.badge.badgeValid : false} />}
        />
        <CardBody>
          <div className="mb-5">
            <Field label="Badge under verification">
              <ValueLine>{OWN_AGENT.agentId}</ValueLine>
            </Field>
          </div>
          <PanelBody payload={ownBadge} />
        </CardBody>
      </Card>

      {ownBadge.data?.kind === "badge" &&
      !ownBadge.data.badge.badgeValid ? (
        <RemainingBlockers verdict={ownBadge.data.badge} />
      ) : null}

      <Card className="mt-4">
        <CardHeader
          title={isFallback ? "Account check — recorded owner (fallback)" : "Account check — connected wallet"}
          subtitle="Verifies every badge owned by the account"
        />
        <CardBody>
          <div className="mb-5">
            <Field label="Account">
              <ValueLine>{lookupAccount}</ValueLine>
            </Field>
          </div>
          <PanelBody payload={accountCheck} />
        </CardBody>
      </Card>
    </>
  );
}

type PanelState = "loading" | "error" | "ready";

function stateOf(check: { loading: boolean; error: string | null }): PanelState {
  if (check.loading) return "loading";
  if (check.error) return "error";
  return "ready";
}

function VerdictAction({ state, valid }: { state: PanelState; valid: boolean }) {
  if (state === "loading") {
    return (
      <Badge tone="neutral" dot>
        Checking live…
      </Badge>
    );
  }
  if (state === "error") {
    return (
      <Badge tone="danger" dot>
        Check failed
      </Badge>
    );
  }
  return <BadgeVerdictBadge badgeValid={valid} />;
}

function PanelBody({
  payload,
}: {
  payload: { loading: boolean; error: string | null; data: BadgeCheckPayload | null; reload: () => void };
}) {
  if (payload.loading) return <CheckSkeleton />;
  if (payload.error) return <CheckError message={payload.error} onRetry={payload.reload} />;
  if (!payload.data) return null;

  const agents: NormalizedBadgeVerdict[] =
    payload.data.kind === "account" ? payload.data.agents : [payload.data.badge];

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={ShieldIcon}
        title="No badges to verify"
        description="This account owns no CIS-8004 agents, so there is nothing to verify."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {agents.map((agent) => (
        <CheckResultView key={agent.tokenId} agent={agent} />
      ))}
    </div>
  );
}

function CheckResultView({ agent }: { agent: NormalizedBadgeVerdict }) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          Agent #{agent.tokenId} ·{" "}
          <span className="font-mono text-xs text-ink-secondary">
            {agent.tokenAddress}
          </span>
        </p>
        <BadgeVerdictBadge badgeValid={agent.badgeValid} />
      </div>
      <HashComparison
        served={agent.cardSha256}
        onChain={agent.onChain.metadata_hash_hex}
      />
      <div className="mt-4">
        <VerificationCheckList checks={checksFromVerdict(agent)} dense />
      </div>
      {agent.issues.length > 0 ? (
        <div className="mt-3 rounded-md border border-warning/20 bg-warning-muted px-3 py-2">
          <ul className="list-inside list-disc text-xs leading-5 text-ink-secondary">
            {agent.issues.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RemainingBlockers({ verdict }: { verdict: NormalizedBadgeVerdict }) {
  const blockers = checksFromVerdict(verdict).filter(
    (check) => !check.passed && !check.optional,
  );

  return (
    <Card className="mt-4">
      <CardHeader
        title={`Remaining blockers — Agent #${verdict.tokenId}`}
        subtitle="Live checks that must clear before the verification gate allows commerce"
        action={
          <Badge tone="danger" dot>
            {blockers.length} blocking
          </Badge>
        }
      />
      <CardBody>
        {blockers.length === 0 ? (
          <p className="text-xs leading-5 text-ink-muted">
            The registry reports no explicit failing checks, but the overall
            verdict is still badge_valid = false. The gate stays blocked.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {blockers.map((blocker) => (
              <li
                key={blocker.id}
                className="rounded-lg border border-danger/20 bg-danger-muted px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{blocker.label}</p>
                  <Badge tone={blocker.notEvaluated ? "neutral" : "danger"} dot>
                    {blocker.notEvaluated ? "Not evaluated" : "Blocked"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-secondary">
                  {blocker.detail}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-5 text-ink-muted">
          Everything above is read live from the hosted Concordium registry
          verdict. Once the on-chain hash and the badge extension checks pass,
          the gate allows commerce automatically — no code changes required.
        </p>
      </CardBody>
    </Card>
  );
}

function CheckSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-surface-raised" />
      ))}
    </div>
  );
}

function CheckError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Badge tone="danger" dot>
        Verification service unreachable
      </Badge>
      <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
      >
        Retry
      </button>
    </div>
  );
}
