import "server-only";
import { DEFAULT_NETWORK, checkBadge, isAccountBadgeResult } from "./live";
import type {
  BadgeCheckResult,
  NormalizedBadgeVerdict,
  RegistryNetwork,
  TrustGateResult,
} from "./live-types";
import { checksFromVerdict, normalizeBadgeVerdict } from "./verdict";

/**
 * The TrustMarket verification gate.
 *
 * Commerce is only allowed when the live hosted registry service returns
 * a fully valid badge verdict for the counterparty. The gate is
 * deliberately fail-closed: a malformed request, an unknown agent or an
 * unreachable verification service all produce `decision: "block"`.
 *
 * This module is the single place a future x402 checkout must call
 * before signing a payment. It performs reads only.
 */

export interface TrustSubject {
  /** Badge token address (base58), when known. */
  tokenAddress?: string;
  /** Owner account, used with `tokenId` when the token address is unknown. */
  ownerAccount?: string;
  /** Numeric agent number, used to select one badge from an account. */
  tokenId?: number;
}

const SOURCE = "concordium-agent-registry-mcp" as const;

/**
 * Resolve one badge verdict from the registry. Accepts either a badge
 * token address, or an owner account plus the agent number (the
 * marketplace knows both from the indexer).
 */
export async function resolveBadgeVerdict(
  subject: TrustSubject,
  network: RegistryNetwork = DEFAULT_NETWORK,
): Promise<NormalizedBadgeVerdict | null> {
  if (subject.tokenAddress) {
    const result = await checkBadge(subject.tokenAddress, network);
    if (!isAccountBadgeResult(result)) {
      return normalizeBadgeVerdict(result, network);
    }
    const match = pickAgent(result.agents, subject.tokenId);
    return match ? normalizeBadgeVerdict(match, result.network) : null;
  }

  if (subject.ownerAccount) {
    const result = await checkBadge(subject.ownerAccount, network);
    if (!isAccountBadgeResult(result)) {
      if (subject.tokenId && result.token_id !== subject.tokenId) return null;
      return normalizeBadgeVerdict(result, network);
    }
    const match = pickAgent(result.agents, subject.tokenId);
    return match ? normalizeBadgeVerdict(match, result.network) : null;
  }

  return null;
}

function pickAgent(
  agents: BadgeCheckResult[],
  tokenId: number | undefined,
): BadgeCheckResult | null {
  if (tokenId != null) {
    return agents.find((agent) => agent.token_id === tokenId) ?? null;
  }
  return agents.length === 1 ? agents[0] : null;
}

/**
 * Evaluate the hiring gate for one counterparty. Never throws for
 * upstream failures — those are converted into a blocking verdict with
 * `verificationPerformed: false`.
 */
export async function evaluateTrustGate(
  subject: TrustSubject,
  network: RegistryNetwork = DEFAULT_NETWORK,
): Promise<TrustGateResult> {
  const checkedAt = new Date().toISOString();

  let verdict: NormalizedBadgeVerdict | null = null;
  try {
    verdict = await resolveBadgeVerdict(subject, network);
  } catch (error) {
    return {
      decision: "block",
      verificationPerformed: false,
      checkedAt,
      network,
      subject: null,
      badge: null,
      checks: [],
      blockReasons: [
        "The live Concordium verification service could not be reached, so the counterparty cannot be verified. Commerce is blocked (fail closed).",
        error instanceof Error ? error.message : "Unknown verification error.",
      ],
      source: SOURCE,
    };
  }

  if (!verdict) {
    return {
      decision: "block",
      verificationPerformed: true,
      checkedAt,
      network,
      subject: null,
      badge: null,
      checks: [],
      blockReasons: [
        "No matching CIS-8004 registration was found for this counterparty in the live registry. Commerce is blocked.",
      ],
      source: SOURCE,
    };
  }

  const checks = checksFromVerdict(verdict);
  const isActive = verdict.onChain.status === "Active";
  const coreChecksPass =
    verdict.checks.on_chain_agent_found &&
    verdict.checks.status_active &&
    verdict.badgeValid;

  const blockReasons: string[] = [];
  if (!isActive) {
    blockReasons.push(
      `Registration status is "${verdict.onChain.status}", not Active.`,
    );
  }
  if (!verdict.badgeValid) {
    const issueMessages = verdict.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => issue.message);
    if (issueMessages.length > 0) blockReasons.push(...issueMessages);
    else blockReasons.push("The live registry verdict is badge_valid = false.");
  }
  if (blockReasons.length === 0 && !coreChecksPass) {
    blockReasons.push("One or more required verification checks did not pass.");
  }

  return {
    decision:
      isActive && verdict.badgeValid && coreChecksPass ? "allow" : "block",
    verificationPerformed: true,
    checkedAt,
    network: verdict.network,
    subject: {
      tokenId: verdict.tokenId,
      tokenAddress: verdict.tokenAddress,
      ownerAccount: verdict.onChain.owner_account,
      status: verdict.onChain.status,
      agentUri: verdict.agentUri,
    },
    badge: {
      valid: verdict.badgeValid,
      checks: verdict.checks,
      issues: verdict.issues,
    },
    checks,
    blockReasons,
    source: SOURCE,
  };
}

/** Convenience guard for future server-side payment flows. */
export async function assertAgentTrusted(
  subject: TrustSubject,
  network: RegistryNetwork = DEFAULT_NETWORK,
): Promise<TrustGateResult> {
  const result = await evaluateTrustGate(subject, network);
  if (result.decision !== "allow") {
    throw new Error(`Trust gate blocked: ${result.blockReasons.join(" ")}`);
  }
  return result;
}
