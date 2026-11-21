import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { RegistryHttpError, getAgent, listAgents } from "@/lib/concordium/live";
import type {
  AgentCard,
  AgentService,
  IndexerAgent,
  MarketplaceListing,
} from "@/lib/concordium/live-types";

/**
 * Real Agent Card discovery over the live registry.
 *
 * Scans a window of Active testnet agents, fetches the Agent Card
 * hosted at each agent's `agent_uri` server-side, hashes the served
 * bytes with SHA-256 and compares against the on-chain
 * `metadata_hash_hex` anchor. Unreachable or mismatched cards are
 * reported honestly instead of silently dropped or faked.
 *
 * One clearly labelled demo seller (a real, live-verified testnet
 * agent) is pinned so the verified checkout path is demonstrable even
 * when the public scan window contains no valid badges. Its badge is
 * still checked live by the gate — nothing is asserted here.
 */

const SCAN_SIZE = 60;
const MAX_CARDS = 12;
const CARD_TIMEOUT_MS = 8_000;
const DEMO_VERIFIED_SELLER = 43;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

  try {
    const [list, demoSeller] = await Promise.all([
      listAgents({ limit: SCAN_SIZE, offset, status: "Active" }),
      buildDemoSeller(),
    ]);

    const withUri = list.agents.filter((a) => a.agent_uri);
    const picks = withUri.slice(0, MAX_CARDS);

    const listings = await Promise.all(picks.map((agent) => buildListing(agent)));

    const reachable = listings.filter((l): l is MarketplaceListing => l !== null);
    const unreachable = picks.length - reachable.length;

    return NextResponse.json({
      scanned: list.count,
      windowOffset: offset,
      windowTotal: list.total,
      withCardUri: withUri.length,
      examined: picks.length,
      reachable,
      demoSellers: demoSeller ? [demoSeller] : [],
      unreachable,
    });
  } catch (error) {
    const code = error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: code },
    );
  }
}

async function buildDemoSeller(): Promise<MarketplaceListing | null> {
  try {
    const { agent } = await getAgent(DEMO_VERIFIED_SELLER);
    if (!agent?.agent_uri || agent.status !== "Active") return null;
    const listing = await buildListing(agent);
    if (!listing) return null;

    return {
      ...listing,
      demo: true,
      name: `Verified seller demo — Agent #${agent.token_id}`,
      description:
        "A real, Active testnet agent whose Concordium badge is verified live by the gate below. The service is a clearly labelled demo; the trust check is real.",
      provider: "Demo listing · Concordium Testnet",
      services: [
        {
          name: "Demo · Agent trust audit",
          description:
            "Sample supervised engagement: the seller reviews another agent's registry record, Agent Card hash and badge before a data exchange.",
          endpoint: "",
          price: null,
        },
      ],
    };
  } catch {
    return null;
  }
}

async function buildListing(agent: IndexerAgent): Promise<MarketplaceListing | null> {
  const uri = agent.agent_uri!;
  let card: AgentCard | null = null;
  let servedBytes: string | null = null;

  try {
    const res = await fetch(uri, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(CARD_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    servedBytes = await res.text();
    card = JSON.parse(servedBytes) as AgentCard;
  } catch {
    return null;
  }

  const servedHash = createHash("sha256").update(servedBytes, "utf8").digest("hex");
  const cardHashMatches =
    agent.metadata_hash_hex != null && servedHash === agent.metadata_hash_hex;

  return {
    tokenId: agent.token_id,
    ownerAccount: agent.owner_account,
    agentUri: uri,
    registeredAt: agent.registered_at,
    name: typeof card.name === "string" ? card.name : `Agent #${agent.token_id}`,
    description: typeof card.description === "string" ? card.description : "",
    skills: Array.isArray(card.skills)
      ? card.skills
          .filter(
            (s): s is NonNullable<AgentCard["skills"]>[number] => !!s && typeof s === "object",
          )
          .map((s) => ({
            name: typeof s.name === "string" ? s.name : "Unnamed skill",
            description: typeof s.description === "string" ? s.description : "",
            tags: Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === "string") : [],
          }))
      : [],
    services: Array.isArray(card.services)
      ? card.services
          .filter(
            (s): s is NonNullable<AgentCard["services"]>[number] => !!s && typeof s === "object",
          )
          .map((s) => ({
            name: typeof s.name === "string" ? s.name : "Unnamed service",
            description: typeof s.description === "string" ? s.description : "",
            endpoint:
              (typeof s.endpointUrl === "string" && s.endpointUrl) ||
              (typeof s.endpoint === "string" && s.endpoint) ||
              "",
            price: normalizePrice(s.price),
          }))
      : [],
    provider:
      typeof card.provider?.organization === "string"
        ? card.provider.organization
        : typeof card.provider?.name === "string"
          ? card.provider.name
          : null,
    cardHashMatches,
  };
}

function normalizePrice(price: unknown): AgentService["price"] {
  if (!price || typeof price !== "object") return null;
  const p = price as { amount?: unknown; currency?: unknown };
  const amount =
    typeof p.amount === "number"
      ? String(p.amount)
      : typeof p.amount === "string"
        ? p.amount
        : null;
  const currency = typeof p.currency === "string" ? p.currency : null;
  if (!amount || !currency) return null;
  return { amount, currency };
}
