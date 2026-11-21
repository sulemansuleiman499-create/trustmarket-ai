import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-white/[0.03] text-ink-secondary",
  accent: "border-accent/25 bg-accent-muted text-accent-hover",
  success: "border-success/25 bg-success-muted text-success",
  warning: "border-warning/25 bg-warning-muted text-warning",
  danger: "border-danger/25 bg-danger-muted text-danger",
};

/**
 * Small status badge used for registration status, network, statuses,
 * and data provenance tags.
 */
export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 tracking-wide whitespace-nowrap ${toneClasses[tone]} ${className}`}
    >
      {dot ? (
        <span
          aria-hidden
          className={`size-1.5 rounded-full bg-current opacity-80`}
        />
      ) : null}
      {children}
    </span>
  );
}
