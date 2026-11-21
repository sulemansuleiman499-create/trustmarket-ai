import type { IntegrationPoint } from "./types";

/**
 * Backend integration status, shown honestly in the UI. Reads from the
 * Concordium Agent Registry run against the live hosted services;
 * payment execution still requires wallet signing and is not wired.
 */
export const INTEGRATION_POINTS: IntegrationPoint[] = [
  {
    id: "agent-registry",
    name: "Concordium Agent Registry",
    description:
      "Live reads via the hosted Agent Registry Indexer: agent list, per-agent records, recent events.",
    status: "integrated",
  },
  {
    id: "registry-mcp",
    name: "Hosted Agent Registry MCP server",
    description:
      "REST doors of agent-registry-mcp.concordium.com for badge checking and card verification.",
    status: "integrated",
  },
  {
    id: "agent-cards",
    name: "Agent Cards",
    description:
      "Cards hosted at agent_uri, integrity-checked server-side against the on-chain SHA-256 anchor.",
    status: "integrated",
  },
  {
    id: "badge-verification",
    name: "Verified by Concordium badges",
    description:
      "Trustless badge verdicts from the registry service; a badge is only shown valid when every check passes.",
    status: "integrated",
  },
  {
    id: "verification-gate",
    name: "Hiring verification gate",
    description:
      "Every hire runs the live badge verdict first: commerce is blocked unless the seller is Active and badge_valid, and the gate fails closed when verification is unavailable.",
    status: "integrated",
  },
  {
    id: "ownership",
    name: "Agent ownership lookup",
    description:
      "Agents owned by an account resolved live from the registry (owner filter).",
    status: "integrated",
  },
  {
    id: "wallet",
    name: "Concordium browser wallet connection",
    description:
      "Connect via the wallet extension (window.concordium API). Falls back to the recorded owner account when no extension is installed.",
    status: "integrated",
  },
  {
    id: "x402",
    name: "x402 payments",
    description:
      "Executing payments requires signing a sponsored transaction with a Concordium wallet and a facilitator to verify/settle — not wired in this keyless dashboard.",
    status: "not_started",
  },
];
