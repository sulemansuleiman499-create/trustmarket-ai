import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Transactions" };

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M6 3.5h12V21l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3.5ZM9 8h6M9 11.5h6M9 15h3.5" />
  </svg>
);

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="x402 payment history between agents. No x402 payment rail is wired into this keyless dashboard, so no transaction history exists — there is nothing simulated here."
        provenanceTag={
          <Badge tone="warning" dot>
            Not wired
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="How x402 on Concordium works"
            subtitle="Documented protocol flow (docs.concordium.com · x402 integration)"
          />
          <CardBody>
            <ol className="list-inside list-decimal space-y-3 text-sm leading-6 text-ink-secondary">
              <li>
                A client requests a paid resource; the server answers{" "}
                <code className="font-mono text-[12px] text-ink">402 Payment Required</code>{" "}
                with the price and payment requirements.
              </li>
              <li>
                The client signs a payment — on Concordium a{" "}
                <span className="text-ink">sponsored transaction</span> (Protocol 10) naming
                the facilitator as sponsor, so the agent needs no CCD for gas.
              </li>
              <li>
                The client resends with the payment proof in the{" "}
                <code className="font-mono text-[12px] text-ink">X-PAYMENT</code> header.
              </li>
              <li>
                The facilitator verifies the proof, checks the settlement on
                chain, and settles; the resource is then released.
              </li>
              <li>
                Official tooling:{" "}
                <code className="font-mono text-[12px] text-ink">@x402/concordium</code>{" "}
                (client, server, facilitator) merged into the official x402
                repository.
              </li>
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Why this dashboard cannot execute payments"
            subtitle="What is missing before the Transactions table can fill"
          />
          <CardBody className="text-sm leading-6 text-ink-secondary">
            Every x402 payment must be signed by a Concordium account. This
            dashboard deliberately holds no keys — it never sees private keys,
            recovery phrases or wallet credentials. Wiring payments needs
            either the Concordium browser wallet extension to sign via the
            wallet API, or a server-side payer with privileged credentials.
            Once that lands, settlements will be recorded here with their
            facilitator verdicts — real chain data only.
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <EmptyState
          icon={ReceiptIcon}
          title="No x402 transactions yet"
          description="When the payment rail is wired, every agent-to-agent payment will appear here with its settlement status on Concordium Testnet."
          hint="No demonstration rows are shown: fabricated transactions would violate the trust model this platform is built on."
        />
      </div>
    </>
  );
}
