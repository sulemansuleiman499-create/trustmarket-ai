import type { ReactNode } from "react";
import { Card } from "./card";

/*
 * Table primitives with shared row, header and cell styling so every
 * table in the dashboard looks identical.
 */
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    </Card>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-line bg-surface-raised/60">
        {children}
      </tr>
    </thead>
  );
}

const th =
  "px-5 py-3 text-[11px] font-medium tracking-wider text-ink-muted uppercase whitespace-nowrap";
const td = "px-5 py-3.5 align-middle text-ink-secondary";

export function Th({ children }: { children: ReactNode }) {
  return <th scope="col" className={th}>{children}</th>;
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-line last:border-b-0 hover:bg-white/[0.015]">
      {children}
    </tr>
  );
}

export function Td({
  children,
  emphasis = false,
  className = "",
}: {
  children: ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`${td} ${emphasis ? "font-medium text-ink" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
