import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { MyAgentsLive } from "@/components/live/my-agents-live";

export const metadata = { title: "My Agents" };

export default function MyAgentsPage() {
  return (
    <>
      <PageHeader
        title="My Agents"
        description="Agents owned by the connected Concordium wallet, resolved live from the Agent Registry. Connect the browser wallet extension to look up a different account."
        provenanceTag={
          <Badge tone="success" dot>
            Live · registry
          </Badge>
        }
      />

      <MyAgentsLive />
    </>
  );
}
