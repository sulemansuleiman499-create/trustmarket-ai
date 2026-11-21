import type {
  BadgeCheckResult,
  NormalizedBadgeVerdict,
  RegistryNetwork,
  VerificationCheck,
} from "./live-types";

/**
 * Pure helpers that turn a raw MCP badge verdict into the normalized
 * shape used by the UI and the trust gate. No I/O, no server-only
 * imports — safe to call on both sides of the wire.
 */

export function normalizeBadgeVerdict(
  b: BadgeCheckResult,
  fallbackNetwork?: RegistryNetwork,
): NormalizedBadgeVerdict {
  return {
    tokenId: b.token_id,
    tokenAddress: b.token_address,
    agentUri: b.agent_uri,
    cardSha256: b.card_sha256,
    httpStatus: b.http_status,
    onChain: b.on_chain,
    checks: b.checks,
    badgeValid: b.badge_valid,
    issues: b.issues,
    network: b.network ?? fallbackNetwork ?? "testnet",
  };
}

/**
 * The exact check list displayed on Trust & Verification, My Agents and
 * the hiring gate. Values come straight from the MCP verdict; flags that
 * the service did not evaluate are surfaced as "Not evaluated" rather
 * than guessed.
 */
export function checksFromVerdict(
  verdict: NormalizedBadgeVerdict,
): VerificationCheck[] {
  const c = verdict.checks;
  const anchor = verdict.onChain.metadata_hash_hex;

  return [
    {
      id: "on_chain_agent_found",
      label: "On-chain record exists",
      passed: c.on_chain_agent_found,
      detail: `CIS-8004 token #${verdict.tokenId} resolved on ${verdict.network}.`,
    },
    {
      id: "status_active",
      label: "Registration Active",
      passed: c.status_active,
      detail: `Status: ${verdict.onChain.status}. Revoked or inactive agents block commerce.`,
    },
    {
      id: "has_agent_uri",
      label: "Agent Card pinned",
      passed: c.has_agent_uri,
      detail: verdict.agentUri
        ? `Pinned at ${verdict.agentUri}`
        : "No agent_uri on chain — no card to verify.",
    },
    {
      id: "card_fetched",
      label: "Agent Card fetched",
      passed: c.card_fetched === true,
      notEvaluated: c.card_fetched == null,
      detail:
        c.card_fetched == null
          ? "Not evaluated — the registry did not fetch a card."
          : c.card_fetched
            ? `Card served${verdict.httpStatus ? ` (HTTP ${verdict.httpStatus})` : ""}; SHA-256 ${shortHash(verdict.cardSha256)}.`
            : "The card URL could not be fetched.",
    },
    {
      id: "hash_matches_on_chain",
      label: "Card SHA-256 matches on-chain anchor",
      passed: c.hash_matches_on_chain === true,
      notEvaluated: c.hash_matches_on_chain == null,
      detail:
        c.hash_matches_on_chain == null
          ? "Not evaluated."
          : c.hash_matches_on_chain
            ? `Served card hash equals the on-chain anchor (${shortHash(anchor)}).`
            : anchor
              ? `Served card hash ${shortHash(verdict.cardSha256)} does not match the on-chain anchor ${shortHash(anchor)}. The owner must update the on-chain metadata_hash to the served card's SHA-256 for this check to pass.`
              : "No on-chain metadata_hash anchor is set, so the served card cannot be matched.",
    },
    {
      id: "badge_present",
      label: "Concordium badge present in card",
      passed: c.badge_present === true,
      notEvaluated: c.badge_present == null,
      detail:
        c.badge_present == null
          ? "Not evaluated."
          : c.badge_present
            ? "Card carries a registry-recognized concordium-badge extension or legacy block."
            : "The registry does not recognize a Concordium badge in this card. Declare it at capabilities.extensions with the exact URI https://docs.concordium.com/a2a-extensions/concordium-badge/v1 (a different URI prefix is not counted) or use the legacy top-level `concordium` block.",
    },
    {
      id: "badge_well_formed",
      label: "Concordium badge well-formed",
      passed: c.badge_well_formed === true,
      notEvaluated: c.badge_well_formed == null,
      detail:
        c.badge_well_formed == null
          ? "Not evaluated."
          : c.badge_well_formed
            ? "The badge block conforms to the registry extension format."
            : "The badge block is missing or does not conform to the v1 extension schema. Required params: tokenAddress (CAIP-19), owner.account (CAIP-10), contracts.cis8004/cis8 (CAIP-10) and verify. Then re-anchor the card hash on chain.",
    },
    ...extensionChecks(verdict),
  ];
}

/** Extra flags the registry reports once a badge block was recognized. */
function extensionChecks(verdict: NormalizedBadgeVerdict): VerificationCheck[] {
  const c = verdict.checks;
  const checks: VerificationCheck[] = [];

  if (c.badge_embedding != null) {
    checks.push({
      id: "badge_embedding",
      label: "Badge embedding form",
      passed: c.badge_embedding === "extension" || c.badge_embedding === "legacy",
      detail: `Registry detected the badge as: ${c.badge_embedding}.`,
    });
  }

  if (c.token_address_matches != null) {
    checks.push({
      id: "token_address_matches",
      label: "Badge token address matches on-chain token",
      passed: c.token_address_matches,
      detail: c.token_address_matches
        ? "The CAIP-19 tokenAddress resolves to this exact on-chain badge."
        : "The card's tokenAddress does not resolve to this on-chain badge.",
    });
  }

  if (c.owner_matches != null) {
    checks.push({
      id: "owner_matches",
      label: "Badge owner matches on-chain owner",
      passed: c.owner_matches,
      detail: c.owner_matches
        ? `Owner matches ${verdict.onChain.owner_account}.`
        : "The card's owner.account does not match the on-chain owner.",
    });
  }

  if (c.chain_matches != null) {
    checks.push({
      id: "chain_matches",
      label: "Badge network matches registered chain",
      passed: c.chain_matches,
      detail: c.chain_matches
        ? "The badge's network resolves to the chain the agent is registered on."
        : "The card's badge network does not match the agent's registered chain.",
    });
  }

  if (c.contracts_match != null) {
    checks.push({
      id: "contracts_match",
      label: "Badge contracts match registry instances",
      passed: c.contracts_match,
      detail: c.contracts_match
        ? "contracts.cis8004 and contracts.cis8 name the registry instances."
        : (issueDetail(verdict, ["contracts.cis8004", "contracts.cis8"]) ??
          "The card's contracts block does not name the registry's CIS-8004/CIS-8 instances (expected CAIP-10 `<chain>:12802.0` / `<chain>:12801.0`)."),
    });
  }

  if (c.verify_present != null) {
    const legacy = c.badge_embedding === "legacy";
    checks.push({
      id: "verify_present",
      label: "Verify instruction present",
      passed: c.verify_present,
      optional: legacy,
      detail: c.verify_present
        ? "The badge carries a human-readable verification instruction."
        : legacy
          ? "The legacy badge form predates the `verify` field; the registry reports this as a warning, not a failure."
          : "The badge omits the required `verify` instruction.",
    });
  }

  if (c.extension_conformant != null) {
    checks.push({
      id: "extension_conformant",
      label: "Extension conforms to the v1 schema",
      passed: c.extension_conformant,
      detail: c.extension_conformant
        ? "Every extension field matches the registry and the v1 schema."
        : (issueDetail(verdict, ["contracts.cis8004", "contracts.cis8", "owner", "tokenAddress", "verify"]) ??
          "One or more extension fields do not match the registry or the v1 schema."),
    });
  }

  if (c.verification_present != null) {
    checks.push({
      id: "verification_present",
      label: "Verification hints (optional)",
      passed: c.verification_present,
      optional: true,
      detail: c.verification_present
        ? "The optional `verification` resolver block is present."
        : "The optional `verification` resolver block is absent — not required for validity.",
    });
  }

  return checks;
}

function issueDetail(
  verdict: NormalizedBadgeVerdict,
  fields: string[],
): string | null {
  const matches = verdict.issues.filter(
    (issue) => issue.field != null && fields.includes(issue.field),
  );
  if (matches.length === 0) return null;
  return matches
    .map((issue) => {
      if (issue.expected == null && issue.actual == null) return issue.message;
      return `${issue.message} (expected ${formatValue(issue.expected)}, actual ${formatValue(issue.actual)})`;
    })
    .join(" ");
}

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function shortHash(hash: string | null | undefined): string {
  return hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : "—";
}
