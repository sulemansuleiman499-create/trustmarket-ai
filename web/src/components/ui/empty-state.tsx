import type { ReactNode } from "react";
import type { SVGProps } from "react";
import { Card } from "./card";

interface EmptyStateProps {
  icon: (p: SVGProps<SVGSVGElement>) => ReactNode;
  title: string;
  description: string;
  hint?: ReactNode;
  action?: ReactNode;
}

/**
 * Professional empty state. Used across Marketplace, Transactions and
 * anywhere live data does not exist yet.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-lg border border-line-strong bg-surface-raised text-ink-muted">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-sm font-medium tracking-tight text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-secondary">
        {description}
      </p>
      {hint ? (
        <p className="mt-2 max-w-md text-xs leading-5 text-ink-muted">{hint}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
