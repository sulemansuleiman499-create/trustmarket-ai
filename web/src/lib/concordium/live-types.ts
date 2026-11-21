/**
 * Response shapes of the live Concordium Agent Registry infrastructure,
 * as documented at:
 *   - Hosted MCP REST doors: https://agent-registry-mcp.concordium.com (openapi.json)
 *   - Indexer: https://agent-registry-indexer.concordium.com (route list at "/")
 *
 * These describe real, probed endpoints on 2026-11-10. Fields tolerate
 * drift (unknown/absent values) via optional properties.
 */

export type RegistryNetwork = "mainnet" | "testnet" | "devnet";

/** Indexer — GET /agents and GET /agents/:id */
export interface IndexerAgent {
  network: RegistryNetwork;
  token_id: number;
  owner_account: string;
  agent_uri: string | null;
  metadata_hash_hex: string | null;
  agent_wallet?: string | null;
  status: string;
  registered_at: string;
  last_event_block: number;
}

export interface IndexerAgentDetail {
  network: RegistryNetwork;
  agent: IndexerAgent;
  metadata: Record<string, unknown>;
}

export interface IndexerAgentList {
  network: RegistryNetwork;
  count: number;
  total: number;
  agents: IndexerAgent[];
}

/** Indexer — GET /status */
export interface IndexerNetworkStatus {
  sync_height: number | null;
  chain_height: number | null;
  lag_blocks: number | null;
  last_synced_at: string | null;
  agents: number;
  agent_events: number;
}

export interface IndexerStatus {
  version: string;
  default_network: RegistryNetwork;
  networks: Partial<Record<RegistryNetwork, IndexerNetworkStatus>>;
}

/** Indexer — GET /events/recent */
export interface IndexerEvent {
  block_height: number;
  block_hash: string;
  tx_hash: string;
  event_index: number;
  event_name: string;
  token_id: number;
  payload: { raw_hex?: string; decoded?: boolean };
  timestamp: string;
}

export interface IndexerEventList {
  network: RegistryNetwork;
  count: number;
  events: IndexerEvent[];
}

export interface BadgeIssue {
  severity: string;
  field?: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
}

/**
 * The real check flags returned by the hosted MCP `check-badge` tool.
 * The `card_*` / `hash_*` / `badge_*` flags are only present once a
 * pinned Agent Card was actually fetched.
 */
export interface BadgeChecks {
  on_chain_agent_found: boolean;
  status_active: boolean;
  has_agent_uri: boolean;
  card_fetched?: boolean;
  hash_matches_on_chain?: boolean;
  badge_present?: boolean;
  /** "extension" | "legacy" when a badge block was found. */
  badge_embedding?: string;
  badge_well_formed?: boolean;
  token_address_matches?: boolean;
  owner_matches?: boolean;
  /** Reported for legacy badge blocks; extension form carries it via CAIP-19. */
  chain_matches?: boolean;
  contracts_match?: boolean;
  verify_present?: boolean;
  extension_conformant?: boolean;
  /** Optional per the v1 schema. */
  verification_present?: boolean;
}

/** MCP REST — GET /v1/check-badge/{badge|account} (token/badge verdict) */
export interface BadgeCheckResult {
  token_id: number;
  token_address: string;
  agent_uri: string | null;
  http_status: number | null;
  card_sha256: string | null;
  on_chain: {
    owner_account: string;
    status: string;
    agent_uri: string | null;
    metadata_hash_hex: string | null;
  };
  checks: BadgeChecks;
  badge_valid: boolean;
  issues: BadgeIssue[];
  /** Absent on entries nested inside an account-level response. */
  network?: RegistryNetwork;
  expected?: Record<string, unknown>;
}

/** MCP REST — GET /v1/check-badge/{account} */
export interface AccountBadgeCheckResult {
  network: RegistryNetwork;
  account: string;
  agent_count: number;
  summary: { valid: number; invalid: number };
  agents: BadgeCheckResult[];
}

/** MCP REST — GET /v1/verify-agent-card/{token_address} */
export interface VerifyCardResult {
  match: boolean | null;
  fetched?: { http_status?: number | null; final_url?: string | null } | null;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* App API route payloads (/api/registry/badge-check/[id])             */
/* ------------------------------------------------------------------ */

export interface NormalizedBadgeVerdict {
  tokenId: number;
  tokenAddress: string;
  agentUri: string | null;
  cardSha256: string | null;
  httpStatus: number | null;
  onChain: {
    owner_account: string;
    status: string;
    agent_uri: string | null;
    metadata_hash_hex: string | null;
  };
  checks: BadgeChecks;
  badgeValid: boolean;
  issues: BadgeIssue[];
  network: RegistryNetwork;
}

/** One row in the trust gate / verification checklist. */
export interface VerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  /** True when the check could not be run (no card to fetch, etc.). */
  notEvaluated?: boolean;
  /** Optional schema field — displayed, but never blocks commerce. */
  optional?: boolean;
  detail: string;
}

export type TrustDecision = "allow" | "block";

/**
 * Verdict of the verification gate that guards hiring/payment. `block` is
 * the only safe default: when verification cannot be completed the gate
 * fails closed.
 */
export interface TrustGateResult {
  decision: TrustDecision;
  /** True when the live registry verdict was actually obtained. */
  verificationPerformed: boolean;
  checkedAt: string;
  network: RegistryNetwork;
  subject: {
    tokenId: number;
    tokenAddress: string;
    ownerAccount: string;
    status: string;
    agentUri: string | null;
  } | null;
  badge: {
    valid: boolean;
    checks: BadgeChecks | null;
    issues: BadgeIssue[];
  } | null;
  checks: VerificationCheck[];
  blockReasons: string[];
  source: "concordium-agent-registry-mcp";
}

export type BadgeCheckPayload =
  | { kind: "badge"; badge: NormalizedBadgeVerdict }
  | {
      kind: "account";
      account: string;
      agentCount: number;
      summary: { valid: number; invalid: number };
      agents: NormalizedBadgeVerdict[];
    };

/** Agent Card (A2A-compatible), as served at an agent's `agent_uri`. */
export interface AgentCard {
  name?: string;
  description?: string;
  skills?: Array<{ id?: string; name?: string; description?: string; tags?: string[] }>;
  services?: Array<{
    id?: string;
    name?: string;
    description?: string;
    endpoint?: string;
    endpointUrl?: string;
    price?: { amount?: string | number; currency?: string } | null;
  }>;
  provider?: { organization?: string; name?: string; url?: string };
  [key: string]: unknown;
}

/** One priced (or seller-quoted) service published in an Agent Card. */
export interface AgentService {
  name: string;
  description: string;
  endpoint: string;
  price: { amount: string; currency: string } | null;
}

/**
 * A marketplace listing built from a live registry record and the Agent
 * Card it pins. `demo` marks the one clearly labelled demo seller used
 * to demonstrate the verified checkout path.
 */
export interface MarketplaceListing {
  tokenId: number;
  ownerAccount: string;
  agentUri: string;
  registeredAt: string;
  name: string;
  description: string;
  skills: Array<{ name: string; description: string; tags: string[] }>;
  services: AgentService[];
  provider: string | null;
  cardHashMatches: boolean;
  demo?: boolean;
}

export interface MarketplaceCardsPayload {
  scanned: number;
  windowOffset: number;
  windowTotal: number;
  withCardUri: number;
  examined: number;
  reachable: MarketplaceListing[];
  demoSellers: MarketplaceListing[];
  unreachable: number;
}
