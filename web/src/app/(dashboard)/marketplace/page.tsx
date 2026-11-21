import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { MarketplaceLive } from "@/components/live/marketplace-live";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Services published by Active testnet agents in their Agent Cards, discovered live from the registry. Every hire runs a two-step flow: the live Verified by Concordium badge gate first, payment second. Unverified sellers are blocked before payment can even be prepared."
        provenanceTag={
          <Badge tone="success" dot>
            Live · registry + cards + gate
          </Badge>
        }
      />

      <MarketplaceLive />

      <p className="mt-4 text-xs leading-5 text-ink-muted">
        “Verify &amp; hire” opens the two-step flow. Step 1 resolves the seller&apos;s
        on-chain record, requires an Active registration and checks the pinned
        Agent Card hash and badge against the live registry verdict. A blocked
        seller stops the flow with the reasons shown — no order is created and
        payment stays locked. Only a valid verdict unlocks step 2, a structured
        x402 payment placeholder: card-marked prices or the seller&apos;s x402
        quote, with wallet signing and settlement intentionally not wired in
        this keyless build. Cards marked “Hash mismatch” failed the integrity
        check — the served bytes do not match the SHA-256 pinned on chain.
      </p>
    </>
  );
}
