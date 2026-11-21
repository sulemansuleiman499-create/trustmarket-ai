import { getAgent, listAgents } from "./live";
import { OWN_AGENT } from "./constants";
import type { IndexerAgent } from "./live-types";

/**
 * Agent Registry access. Backed by the live hosted infrastructure:
 * the Concordium Agent Registry Indexer (discovery) and the hosted MCP
 * REST doors (resolution/verification). Read-only; writes such as
 * registration produce sign-ready payloads that must be submitted by
 * the owner's wallet, which is out of scope for a keyless dashboard.
 */

export interface AgentDirectoryQuery {
  limit?: number;
  offset?: number;
  owner?: string;
}

export async function fetchDirectoryAgents(
  query: AgentDirectoryQuery = {},
): Promise<{ agents: IndexerAgent[]; total: number }> {
  const list = await listAgents({
    limit: query.limit ?? 10,
    offset: query.offset ?? 0,
    owner: query.owner,
  });
  return { agents: list.agents, total: list.total };
}

export async function fetchOwnAgent(): Promise<IndexerAgent> {
  const detail = await getAgent(OWN_AGENT.agentNumber);
  return detail.agent;
}
