import { Badge } from "@/components/ui/badge";
import type { VerificationCheck } from "@/lib/concordium/live-types";

/**
 * Side-by-side view of the served card hash and the on-chain anchor.
 * Read straight from the live verdict — no values are assumed.
 */
export function HashComparison({
  served,
  onChain,
}: {
  served: string | null;
  onChain: string | null;
}) {
  const matches = served != null && onChain != null && served === onChain;
  const tone = matches ? "success" : served == null || onChain == null ? "neutral" : "warning";
  const label = matches
    ? "Match"
    : served == null
      ? "No card served"
      : onChain == null
        ? "No anchor"
        : "Mismatch";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
          Card hash vs on-chain anchor
        </p>
        <Badge tone={tone} dot>
          {label}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface-raised/40 px-3.5 py-3">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
            Served card SHA-256
          </p>
          <p className="mt-1 font-mono text-[11px] leading-5 break-all text-ink-secondary">
            {served ?? "Not available"}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised/40 px-3.5 py-3">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
            On-chain metadata_hash
          </p>
          <p className="mt-1 font-mono text-[11px] leading-5 break-all text-ink-secondary">
            {onChain ?? "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Presentational checklist shared by Trust & Verification, My Agents and
 * the Marketplace hiring gate. Renders exactly the flags returned by the
 * live registry verdict — nothing is inferred.
 */
export function VerificationCheckList({
  checks,
  dense = false,
}: {
  checks: VerificationCheck[];
  dense?: boolean;
}) {
  if (checks.length === 0) return null;

  return (
    <ul className={`divide-y divide-line ${dense ? "" : "rounded-lg border border-line bg-surface-raised/40 px-4"}`}>
      {checks.map((check) => {
        const tone = check.optional
          ? check.passed
            ? "success"
            : "neutral"
          : check.passed
            ? "success"
            : check.notEvaluated
              ? "neutral"
              : "warning";
        const label = check.optional
          ? check.passed
            ? "Present"
            : "Optional"
          : check.passed
            ? "Passed"
            : check.notEvaluated
              ? "Not evaluated"
              : "Failed";

        return (
          <li
            key={check.id}
            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{check.label}</p>
              <p className="mt-0.5 text-xs leading-5 break-words text-ink-muted">
                {check.detail}
              </p>
            </div>
            <Badge tone={tone} dot className="mt-0.5 shrink-0">
              {label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
