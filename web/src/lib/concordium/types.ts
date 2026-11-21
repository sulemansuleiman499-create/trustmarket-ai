/**
 * Shared domain types for TrustMarket AI.
 *
 * These types describe the data the dashboard needs from Concordium
 * infrastructure. They are written so that a real implementation
 * (Concordium Agent Registry SDK, hosted Agent Registry MCP server,
 * Verified by Concordium badge checks, x402 payment history) can fill
 * the same shapes without changing the UI layer.
 */

/**
 * Where a displayed value comes from. Used by <DataSourceTag> so the UI
 * never presents demonstration data as genuine blockchain data.
 */
export type Provenance =
  /** Fetched live from Concordium infrastructure. Not used yet. */
  | "blockchain"
  /** Real data recorded by hand (e.g. from the wallet when registering). */
  | "recorded"
  /** Fabricated content that exists only to demo the UI structure. */
  | "demo"
  /** There is no data for this field/section yet. */
  | "none";

export type NetworkName = "concordium-testnet" | "concordium-mainnet";

export interface NetworkInfo {
  id: NetworkName;
  displayName: string;
  /** String identifier used inside Agent IDs ( genesis hash of the chain ). */
  genesisHash: string;
}

export type RegistrationStatus = "registered" | "unregistered" | "unknown";

/**
 * Verification badge status. The only honest default until a real check
 * against the Verified by Concordium infrastructure has been performed.
 */
export type BadgeStatus =
  | "not_verified"
  | "verification_pending"
  | "verified"
  | "verification_failed";

export interface BadgeVerification {
  status: BadgeStatus;
  /** Human-readable explanation that must be shown alongside the status. */
  detail: string;
  /** ISO timestamp of the check, if one was actually performed. */
  checkedAt?: string;
}

export interface AgentRecord {
  /** Numeric agent number assigned by the Agent Registry. */
  agentNumber: number;
  /** CIS-2 token id of the agent registration NFT. */
  tokenId: string;
  /** Full canonical Agent ID, e.g. `ccd:<genesis>/cis-2:<tokenId>`. */
  agentId: string;
  network: NetworkInfo;
  /** Concordium account (wallet address) that owns the agent registration. */
  ownerAccount: string;
  registrationStatus: RegistrationStatus;
  /** Badge status — only trust this after a real verification run. */
  badge: BadgeVerification;
  /** ISO timestamp of when this record was first recorded. Not a chain timestamp. */
  recordedAt: string;
  provenance: Provenance;
}

export type IntegrationStatus = "integrated" | "pending" | "not_started";

export interface IntegrationPoint {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
}
