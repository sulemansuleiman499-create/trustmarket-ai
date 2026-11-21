import type { NetworkInfo } from "./types";

/**
 * Concordium Testnet chain context.
 *
 * The genesis hash below is the chain prefix of our registered Agent ID,
 * confirmed live by the hosted registry service (`expected.chain` in the
 * badge-check verdict).
 */
export const CONCORDIUM_TESTNET: NetworkInfo = {
  id: "concordium-testnet",
  displayName: "Concordium Testnet",
  genesisHash: "4221332d34e1694168c2a0c0b3fd0f27",
};

/**
 * Agent Registry contracts on testnet, as reported live by
 * `GET /v1/check-badge` (`expected.contracts`):
 *   CIS-8004 (Agent Registry)        <12802,0>
 *   CIS-8   (External Key Registry)  <12801,0>
 */
export const TESTNET_CIS8004_CONTRACT = { index: 12802, subindex: 0 };
export const TESTNET_CIS8_CONTRACT = { index: 12801, subindex: 0 };

/**
 * Agent #1168 — our official TrustMarket agent on Concordium Testnet.
 *
 * Every value here is chain truth, exactly as returned live by the
 * registry indexer and the hosted MCP `check-badge` verdict:
 *   - token address `JyP9Wc2XhkYP7aw6JNnif` (note: not `…aw63Nnif`)
 *   - owner account as below
 *   - registration Active, Agent Card pinned at the metadata URI
 *
 * The badge itself is NOT automatically valid: whether the served Agent
 * Card hash matches the on-chain anchor and carries a Concordium badge
 * extension is checked live on every page that displays it.
 */
export const OWN_AGENT = {
  agentNumber: 1168,
  tokenId: "JyP9Wc2XhkYP7aw6JNnif",
  agentId: "ccd:4221332d34e1694168c2a0c0b3fd0f27/cis-2:JyP9Wc2XhkYP7aw6JNnif",
  ownerAccount: "34KoXCiUAWEQkE91FNUVtWAGsq3EAjeFygKRX2WC8puPwEzow2",
  metadataUri:
    "https://raw.githubusercontent.com/sulemansuleiman499-create/trustmarket-ai/main/agent-card.json",
} as const;
