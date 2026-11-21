import type { Provenance } from "@/lib/concordium/types";
import { Badge } from "./badge";
import type { BadgeTone } from "./badge";

/**
 * Displays where a piece of displayed data comes from, so demonstration
 * data can never be mistaken for genuine blockchain data.
 */
const labels: Record<Provenance, { label: string; tone: BadgeTone } | null> = {
  blockchain: { label: "Live · registry", tone: "success" },
  recorded: { label: "Recorded", tone: "accent" },
  demo: { label: "Demonstration", tone: "warning" },
  none: null,
};

export function DataSourceTag({
  provenance,
  className = "",
}: {
  provenance: Provenance;
  className?: string;
}) {
  const meta = labels[provenance];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}
