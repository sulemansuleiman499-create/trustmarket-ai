import type { ReactNode } from "react";

/**
 * Page-level heading for each dashboard section.
 */
export function PageHeader({
  title,
  description,
  provenanceTag,
  actions,
}: {
  title: string;
  description: string;
  provenanceTag?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {provenanceTag}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-secondary">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
