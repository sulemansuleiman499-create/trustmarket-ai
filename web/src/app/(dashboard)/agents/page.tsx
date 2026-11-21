import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { DirectoryTable } from "@/components/live/directory-table";

export const metadata = { title: "Agent Directory" };

export default function AgentDirectoryPage() {
  return (
    <>
      <PageHeader
        title="Agent Directory"
        description="Every agent registered in the Concordium Agent Registry on testnet, served live from the hosted Indexer. Check a counterparty's status and card before transacting."
        provenanceTag={
          <Badge tone="success" dot>
            Live · indexer
          </Badge>
        }
      />

      <DirectoryTable />

      <p className="mt-4 text-xs leading-5 text-ink-muted">
        Ownership, status and Agent Card URIs come straight from the registry.
        Badge verification is a separate trustless check — run it on the Trust
        &amp; Verification page before trading with an agent.
      </p>
    </>
  );
}
