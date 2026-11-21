import "server-only";
import type {
  AccountBadgeCheckResult,
  BadgeCheckResult,
  IndexerAgentDetail,
  IndexerAgentList,
  IndexerEventList,
  IndexerStatus,
  RegistryNetwork,
  VerifyCardResult,
} from "./live-types";

/**
 * Server-side access to the live, public, documented Concordium Agent
 * Registry infrastructure:
 *
 *   MCP REST doors : https://agent-registry-mcp.concordium.com  (openapi.json)
 *   Indexer        : https://agent-registry-indexer.concordium.com
 *
 * All reads are unauthenticated; no credentials or keys are involved.
 * A small in-memory TTL cache keeps us polite to the rate-limited APIs.
 */

const MCP_BASE = "https://agent-registry-mcp.concordium.com";
const INDEXER_BASE = "https://agent-registry-indexer.concordium.com";

export const DEFAULT_NETWORK: RegistryNetwork = "testnet";

export class RegistryHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "RegistryHttpError";
    this.status = status;
  }
}

const TTL_MS = 30_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function getJson<T>(url: string, timeoutMs = 20_000): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new RegistryHttpError(502, `Upstream unreachable: ${url}`);
  }
  let body: unknown = null;
  let raw: string;
  try {
    raw = await res.text();
  } catch {
    throw new RegistryHttpError(502, `Upstream response unreadable: ${url}`);
  }
  try {
    body = raw.length > 0 ? JSON.parse(raw) : null;
  } catch {
    throw new RegistryHttpError(
      res.ok ? 502 : res.status,
      `Upstream returned non-JSON (HTTP ${res.status})`,
    );
  }
  if (body == null) {
    throw new RegistryHttpError(
      res.ok ? 502 : res.status,
      `Upstream returned an empty body (HTTP ${res.status})`,
    );
  }
  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      `Upstream HTTP ${res.status}: ${url}`;
    throw new RegistryHttpError(res.status, message);
  }
  return body as T;
}

/* ------------------------------------------------------------------ */
/* Indexer                                                             */
/* ------------------------------------------------------------------ */

export interface ListAgentsParams {
  network?: RegistryNetwork;
  limit?: number;
  offset?: number;
  owner?: string;
  status?: string;
}

export async function listAgents(params: ListAgentsParams = {}): Promise<IndexerAgentList> {
  const {
    network = DEFAULT_NETWORK,
    limit = 10,
    offset = 0,
    owner,
    status,
  } = params;
  const q = new URLSearchParams({ network, limit: String(limit), offset: String(offset) });
  if (owner) q.set("owner", owner);
  if (status) q.set("status", status);
  return cached(`agents:${q.toString()}`, () =>
    getJson<IndexerAgentList>(`${INDEXER_BASE}/agents?${q.toString()}`, 45_000),
  );
}

export async function getAgent(tokenId: number): Promise<IndexerAgentDetail> {
  return cached(`agent:${DEFAULT_NETWORK}:${tokenId}`, () =>
    getJson<IndexerAgentDetail>(
      `${INDEXER_BASE}/agents/${tokenId}?network=${DEFAULT_NETWORK}`,
    ),
  );
}

export async function registryStatus(): Promise<IndexerStatus> {
  return cached("status", () => getJson<IndexerStatus>(`${INDEXER_BASE}/status`));
}

export async function recentEvents(limit = 6): Promise<IndexerEventList> {
  return cached(`events:${DEFAULT_NETWORK}:${limit}`, () =>
    getJson<IndexerEventList>(
      `${INDEXER_BASE}/events/recent?network=${DEFAULT_NETWORK}&limit=${limit}`,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* MCP REST doors                                                      */
/* ------------------------------------------------------------------ */

/**
 * Verdict for a badge (CIS-2 token address, canonical form also
 * accepted) or for every badge owned by a Concordium account.
 */
export async function checkBadge(
  id: string,
  network: RegistryNetwork = DEFAULT_NETWORK,
): Promise<BadgeCheckResult | AccountBadgeCheckResult> {
  const key = `check-badge:${network}:${id}`;
  const url = `${MCP_BASE}/v1/check-badge/${encodeURIComponent(id)}?network=${network}`;
  return cached(key, async () => {
    try {
      return await getJson<BadgeCheckResult | AccountBadgeCheckResult>(url, 25_000);
    } catch (error) {
      const transient =
        error instanceof RegistryHttpError &&
        (error.status === 502 || error.status >= 500);
      if (!transient) throw error;
      return getJson<BadgeCheckResult | AccountBadgeCheckResult>(url, 25_000);
    }
  });
}

export function isAccountBadgeResult(
  r: BadgeCheckResult | AccountBadgeCheckResult,
): r is AccountBadgeCheckResult {
  return "agents" in r;
}

/** Card hash (server-fetched) vs the on-chain metadata_hash anchor. */
export async function verifyAgentCard(
  tokenAddress: string,
  network: RegistryNetwork = DEFAULT_NETWORK,
): Promise<VerifyCardResult> {
  return getJson<VerifyCardResult>(
    `${MCP_BASE}/v1/verify-agent-card/${encodeURIComponent(tokenAddress)}?network=${network}`,
  );
}
