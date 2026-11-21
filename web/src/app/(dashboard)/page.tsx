import { PageHeader } from "@/components/ui/page-header";
import { DataSourceTag } from "@/components/ui/data-source-tag";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, ValueLine } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { OverviewLive } from "@/components/live/overview-live";
import { INTEGRATION_POINTS } from "@/lib/concordium/integrations";
import { CONCORDIUM_TESTNET, OWN_AGENT, TESTNET_CIS8004_CONTRACT, TESTNET_CIS8_CONTRACT } from "@/lib/concordium/constants";
import type { IntegrationStatus } from "@/lib/concordium/types";

export const metadata = { title: "Overview" };

const statusTone: Record<IntegrationStatus, "success" | "warning" | "neutral"> = {
  integrated: "success",
  pending: "warning",
  not_started: "neutral",
};

const statusLabel: Record<IntegrationStatus, string> = {
  integrated: "Live",
  pending: "Pending",
  not_started: "Not wired",
};

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Marketplace activity and key statistics, sourced live from the Concordium Agent Registry (hosted Indexer + MCP service). Payment statistics stay at zero until x402 execution is wired."
        provenanceTag={
          <Badge tone="success" dot>
            Live · registry
          </Badge>
        }
      />

      <OverviewLive />

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Integration readiness"
            subtitle="What is actually connected to live Concordium infrastructure"
          />
          <CardBody>
            <ul className="divide-y divide-line">
              {INTEGRATION_POINTS.map((point) => (
                <li
                  key={point.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{point.name}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-muted">
                      {point.description}
                    </p>
                  </div>
                  <Badge tone={statusTone[point.status]} dot className="mt-0.5">
                    {statusLabel[point.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Official agent"
              subtitle={`Agent #${OWN_AGENT.agentNumber} · resolved live from the registry`}
              action={<DataSourceTag provenance="blockchain" />}
            />
            <CardBody>
              <dl className="flex flex-col gap-3">
                <Field label="Agent number">
                  <span className="font-mono text-sm text-ink">
                    {OWN_AGENT.agentNumber}
                  </span>
                </Field>
                <Field label="Badge (CIS-2 token address)">
                  <ValueLine>{OWN_AGENT.tokenId}</ValueLine>
                </Field>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Network & contracts"
              subtitle="Confirmed live via the registry badge-check verdict"
            />
            <CardBody>
              <dl className="flex flex-col gap-3">
                <Field label="Network">
                  <span className="text-sm text-ink">
                    {CONCORDIUM_TESTNET.displayName}
                  </span>
                </Field>
                <Field label="Chain (genesis hash)">
                  <ValueLine>{CONCORDIUM_TESTNET.genesisHash}</ValueLine>
                </Field>
                <Field label="CIS-8004 Agent Registry contract">
                  <ValueLine>
                    {`${TESTNET_CIS8004_CONTRACT.index},${TESTNET_CIS8004_CONTRACT.subindex}`}
                  </ValueLine>
                </Field>
                <Field label="CIS-8 External Key Registry contract">
                  <ValueLine>
                    {`${TESTNET_CIS8_CONTRACT.index},${TESTNET_CIS8_CONTRACT.subindex}`}
                  </ValueLine>
                </Field>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
