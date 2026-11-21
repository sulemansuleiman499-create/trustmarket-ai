import type { ReactNode } from "react";
import { Card } from "./card";

export interface Stat {
  label: string;
  value: ReactNode;
  footnote?: ReactNode;
}

/**
 * Overview statistic card. Values shown must come from real recorded
 * data; footnotes explain semantics ("0" means no activity yet).
 */
export function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card className="flex flex-col gap-1 px-5 py-4">
      <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        {stat.label}
      </span>
      <span className="text-3xl leading-9 font-semibold tracking-tight text-ink tabular-nums">
        {stat.value}
      </span>
      {stat.footnote ? (
        <span className="text-xs leading-5 text-ink-muted">
          {stat.footnote}
        </span>
      ) : null}
    </Card>
  );
}
