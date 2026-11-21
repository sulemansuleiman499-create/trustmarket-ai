import type { ReactNode } from "react";

/**
 * Key/value row for showing agent identifiers and other long values.
 */
export function Field({
  label,
  children,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-xs font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-right sm:text-left">
        <div className="mono-truncate">{children}</div>
        {hint ? (
          <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>
        ) : null}
      </dd>
    </div>
  );
}

/**
 * Full-width, single line value (agent IDs, account addresses).
 */
export function ValueLine({ children }: { children: ReactNode }) {
  return (
    <code className="block w-full truncate rounded-md border border-line bg-code px-2.5 py-1.5 text-left font-mono text-[12px] leading-5 text-ink-secondary">
      {children}
    </code>
  );
}
