import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { TrustVerificationPanel } from "@/components/live/trust-verification";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export const metadata = { title: "Trust & Verification" };

export default function TrustPage() {
  return (
    <>
      <PageHeader
        title="Trust & Verification"
        description="Trustless verification of agent badges against the live Concordium registry: resolve the on-chain record, require Active status, and compare the served Agent Card hash to the on-chain anchor."
        provenanceTag={
          <Badge tone="success" dot>
            Live · badge check
          </Badge>
        }
      />

      <TrustVerificationPanel />

      <Card className="mt-4">
        <CardHeader
          title="Why verification matters"
          subtitle="Rule of engagement for the marketplace"
        />
        <CardBody className="text-sm leading-6 text-ink-secondary">
          An agent must establish that its counterparty holds a valid,
          verifiable Concordium identity before conducting business.
          Registration in the Agent Registry alone does not establish Verified
          by Concordium status: the badge is only valid when the on-chain
          record exists, is Active, and the hosted Agent Card&apos;s SHA-256
          matches the <code className="font-mono text-[12px]">metadata_hash</code>{" "}
          committed on chain. All three checks run live here, and a failing
          check is always shown as a failure.
        </CardBody>
      </Card>
    </>
  );
}
