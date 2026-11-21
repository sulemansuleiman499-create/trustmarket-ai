"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { VerificationCheckList } from "./verification-checks";
import type { MarketplaceListing, TrustGateResult } from "@/lib/concordium/live-types";

export type HireGateState =
  | { kind: "verifying" }
  | { kind: "verified"; result: TrustGateResult }
  | { kind: "blocked"; result: TrustGateResult }
  | { kind: "error"; message: string };

type Step = 1 | 2;

const CheckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 4 3.5 19.5h17L12 4Z" />
    <path d="M12 9.5v4.5M12 17.2v.1" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Zm-2.7 8.3 2 2 3.4-3.9" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className} aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
);

const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? "size-4"}`}
  />
);

function shortAccount(account: string): string {
  return account.length > 14
    ? `${account.slice(0, 6)}...${account.slice(-6)}`
    : account;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function HireFlow({
  listing,
  gate,
  onRetry,
  onClose,
}: {
  listing: MarketplaceListing;
  gate: HireGateState;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [serviceIndex, setServiceIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const service = listing.services[serviceIndex] ?? null;
  const verified = gate.kind === "verified";
  const blocked = gate.kind === "blocked";
  const errored = gate.kind === "error";
  const paymentReady = verified && step === 2;

  const stepOneState: StepState = verified
    ? "done"
    : blocked || errored
      ? "failed"
      : "active";
  const stepTwoState: StepState = paymentReady
    ? "active"
    : verified
      ? "next"
      : "locked";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hire-flow-title"
        tabIndex={-1}
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Secure hire</Badge>
              {listing.demo ? <Badge tone="neutral">Demo service</Badge> : null}
            </div>
            <h2 id="hire-flow-title" className="mt-2 truncate text-base font-semibold tracking-tight text-ink">
              {listing.name}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Seller · Agent <span className="font-mono">#{listing.tokenId}</span> ·{" "}
              <span className="font-mono">{shortAccount(listing.ownerAccount)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hire flow"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <ol className="mb-5 flex items-center gap-3">
            <StepMarker index={1} label="Verify seller" state={stepOneState} />
            <li
              aria-hidden
              className={`h-px flex-1 ${verified ? "bg-success/40" : "bg-line-strong"}`}
            />
            <StepMarker index={2} label="Payment" state={stepTwoState} />
          </ol>

          {step === 1 ? (
            <>
              {gate.kind === "verifying" ? <VerifyingPanel /> : null}
              {gate.kind === "error" ? (
                <ErrorPanel message={gate.message} onRetry={onRetry} onClose={onClose} />
              ) : null}
              {gate.kind === "blocked" ? (
                <BlockedPanel result={gate.result} onRetry={onRetry} onClose={onClose} />
              ) : null}
              {gate.kind === "verified" ? (
                <VerifiedPanel
                  result={gate.result}
                  listing={listing}
                  onContinue={() => setStep(2)}
                  onClose={onClose}
                />
              ) : null}
            </>
          ) : null}

          {paymentReady ? (
            <PaymentStep
              result={gate.result}
              listing={listing}
              serviceIndex={serviceIndex}
              onServiceChange={setServiceIndex}
              service={service}
            />
          ) : null}
        </div>

        {paymentReady ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-raised"
            >
              Back to verification
            </button>
            <div className="flex flex-col items-end">
              <button
                type="button"
                disabled
                title="Payment execution is not wired in this keyless demo build."
                className="cursor-not-allowed rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-semibold text-ink-muted opacity-80"
              >
                Sign &amp; pay with Concordium wallet
              </button>
              <span className="mt-1 text-[10px] text-ink-muted">
                Execution disabled — verified state is final in this demo
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type StepState = "done" | "active" | "failed" | "locked" | "next";

function StepMarker({
  index,
  label,
  state,
}: {
  index: number;
  label: string;
  state: StepState;
}) {
  const circle =
    state === "done"
      ? "border-success/40 bg-success-muted text-success"
      : state === "active"
        ? "border-accent/40 bg-accent-muted text-accent-hover"
        : state === "failed"
          ? "border-danger/40 bg-danger-muted text-danger"
          : "border-line-strong bg-surface-raised text-ink-muted";
  const text =
    state === "active"
      ? "text-ink"
      : state === "done"
        ? "text-ink-secondary"
        : state === "failed"
          ? "text-danger"
          : "text-ink-muted";

  return (
    <li className="flex items-center gap-2">
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${circle}`}>
        {state === "done" ? (
          <CheckIcon className="size-3.5" />
        ) : state === "failed" ? (
          <AlertIcon className="size-3.5" />
        ) : state === "locked" ? (
          <LockIcon className="size-3" />
        ) : (
          index
        )}
      </span>
      <span className={`text-xs font-medium whitespace-nowrap ${text}`}>{label}</span>
    </li>
  );
}

function ResultBanner({
  tone,
  title,
  subtitle,
  icon,
}: {
  tone: "success" | "danger";
  title: string;
  subtitle: string;
  icon: "check" | "alert";
}) {
  const styles =
    tone === "success"
      ? "border-success/25 bg-success-muted"
      : "border-danger/25 bg-danger-muted";
  const iconStyles =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : "border-danger/30 bg-danger/10 text-danger";
  const Icon = icon === "check" ? CheckIcon : AlertIcon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${styles}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${iconStyles}`}>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function VerifyingPanel() {
  return (
    <div aria-busy className="rounded-xl border border-line bg-surface-raised/40 px-5 py-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-muted text-accent-hover">
          <Spinner className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            Verifying the seller against Concordium…
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Resolving the CIS-8004 record on Concordium Testnet, fetching the
            pinned Agent Card and checking its hash and badge.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2" aria-hidden>
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-surface-raised" />
        <div className="h-2.5 w-3/5 animate-pulse rounded bg-surface-raised" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-raised" />
      </div>
    </div>
  );
}

function CheckCount({ result }: { result: TrustGateResult }) {
  const passed = result.checks.filter((check) => check.passed).length;
  return (
    <>
      {passed}/{result.checks.length} passed
    </>
  );
}

function CheckDetails({ result }: { result: TrustGateResult }) {
  if (result.checks.length === 0) return null;
  return (
    <details className="mt-4 border-t border-white/10 pt-3">
      <summary className="cursor-pointer text-[11px] font-medium text-ink-secondary select-none hover:text-ink">
        Verification checks (<CheckCount result={result} />)
      </summary>
      <div className="mt-2 max-h-72 overflow-y-auto pr-1">
        <VerificationCheckList checks={result.checks} dense />
      </div>
    </details>
  );
}

function BlockedPanel({
  result,
  onRetry,
  onClose,
}: {
  result: TrustGateResult;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <ResultBanner
        tone="danger"
        icon="alert"
        title="Blocked — trust check failed"
        subtitle="The seller does not hold a valid Verified by Concordium badge right now. No work is started and no payment is possible."
      />

      <div className="mt-4 rounded-xl border border-danger/25 bg-danger-muted/60 px-4 py-3">
        <p className="text-[10px] font-medium tracking-wide text-danger uppercase">
          Why it was blocked
        </p>
        {result.blockReasons.length > 0 ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-ink-secondary">
            {result.blockReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs leading-5 text-ink-secondary">
            The registry returned a non-valid verdict without a specific
            reason. The gate fails closed.
          </p>
        )}
        {!result.verificationPerformed ? (
          <p className="mt-2 text-[11px] leading-5 text-warning">
            Live verification could not be completed, so commerce is blocked by
            default.
          </p>
        ) : null}
      </div>

      {result.subject ? (
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Meta label="Badge token" value={result.subject.tokenAddress} mono />
          <Meta label="Owner" value={shortAccount(result.subject.ownerAccount)} mono />
        </dl>
      ) : null}

      <LockedPayment />

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
        >
          Re-check verification
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-raised"
        >
          Close
        </button>
      </div>

      <CheckDetails result={result} />
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <ResultBanner
        tone="danger"
        icon="alert"
        title="Verification service unreachable"
        subtitle="The gate fails closed: commerce stays blocked until verification can run successfully."
      />
      <p className="mt-3 rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11px] leading-5 break-words text-ink-secondary">
        {message}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-accent/30 bg-accent-muted px-3.5 py-2 text-xs font-medium text-accent-hover hover:bg-accent/20"
        >
          Retry verification
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-raised"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function VerifiedPanel({
  result,
  listing,
  onContinue,
  onClose,
}: {
  result: TrustGateResult;
  listing: MarketplaceListing;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <ResultBanner
        tone="success"
        icon="check"
        title="Verified — commerce allowed"
        subtitle="Every required check passed. The seller's badge is valid on Concordium Testnet, so you can continue to payment."
      />

      <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Meta
          label="Badge token"
          value={result.subject?.tokenAddress ?? `Agent #${listing.tokenId}`}
          mono
        />
        <Meta label="Checked" value={`${formatTime(result.checkedAt)} · live registry`} />
        <Meta
          label="Owner"
          value={shortAccount(result.subject?.ownerAccount ?? listing.ownerAccount)}
          mono
        />
        <Meta label="Network" value="Concordium Testnet" />
      </dl>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-success/20 bg-success-muted/60 px-3 py-2.5">
        <ShieldIcon className="mt-0.5 size-4 shrink-0 text-success" />
        <p className="text-[11px] leading-5 text-ink-secondary">
          The gate resolved the on-chain record, required an Active
          registration, fetched the pinned Agent Card and re-ran every registry
          check: <CheckCount result={result} />.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-muted px-3.5 py-2 text-xs font-semibold text-success hover:bg-success/15"
        >
          Continue to payment
          <ArrowIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-raised"
        >
          Not now
        </button>
      </div>

      <CheckDetails result={result} />
    </div>
  );
}

function PaymentStep({
  result,
  listing,
  service,
  serviceIndex,
  onServiceChange,
}: {
  result: TrustGateResult;
  listing: MarketplaceListing;
  service: MarketplaceListing["services"][number] | null;
  serviceIndex: number;
  onServiceChange: (index: number) => void;
}) {
  const amount = service?.price
    ? `${service.price.amount} ${service.price.currency}`
    : "seller quote via x402";
  const payTo = result.subject?.ownerAccount ?? listing.ownerAccount;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/25 bg-success-muted px-3 py-2">
        <CheckIcon className="size-4 shrink-0 text-success" />
        <p className="text-xs font-medium text-success">
          Verified {formatTime(result.checkedAt)} · gate passed
        </p>
        <span className="ml-auto text-[10px] tracking-wide text-ink-muted uppercase">
          Payment unlocked
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-raised/40 p-4">
        <p className="text-sm font-medium text-ink">Order summary</p>
        <div className="mt-3 space-y-2 text-xs">
          <Row label="Seller" value={listing.name} />
          <Row label="Agent" value={`#${listing.tokenId}`} mono />
          <Row label="Trust check" value="Verified by Concordium" success />
          <Row
            label="Amount"
            value={service?.price ? amount : "Quoted by seller (x402)"}
            accent={!!service?.price}
          />
        </div>

        {listing.services.length > 0 ? (
          <fieldset className="mt-4">
            <legend className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
              Service
            </legend>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {listing.services.map((item, index) => {
                const active = index === serviceIndex;
                return (
                  <label
                    key={`${item.name}-${index}`}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                      active
                        ? "border-accent/40 bg-accent-muted"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hire-service"
                      checked={active}
                      onChange={() => onServiceChange(index)}
                      className="mt-0.5 accent-[var(--color-accent)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-ink-secondary">
                          {item.price
                            ? `${item.price.amount} ${item.price.currency}`
                            : "x402 quote"}
                        </span>
                      </span>
                      {item.description ? (
                        <span className="mt-0.5 block text-[11px] leading-5 text-ink-muted">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <p className="mt-3 text-[11px] leading-5 text-ink-muted">
            The Agent Card publishes no service details. The engagement is
            quoted by the seller through the x402 payment request.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-code p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">x402 payment</p>
          <Badge tone="warning">Not wired in this build</Badge>
        </div>
        <dl className="mt-3 space-y-1.5 font-mono text-[11px] leading-5 text-ink-secondary">
          <IntentRow label="payTo" value={payTo} />
          <IntentRow label="asset" value="CCD" />
          <IntentRow label="amount" value={amount} />
        </dl>
        <p className="mt-3 text-[11px] leading-5 text-ink-muted">
          Structured x402 placeholder. In production the payment request would
          be signed with your Concordium wallet and settled before work starts;
          only a verified seller can reach this step.{" "}
          <span className="font-mono text-ink-secondary">decision === &quot;allow&quot;</span>
        </p>
      </div>
    </div>
  );
}

function LockedPayment() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface-raised/40 px-4 py-3">
      <LockIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-secondary">
          Step 2 · Payment is locked
        </p>
        <p className="mt-0.5 text-[11px] leading-5 text-ink-muted">
          Settlement stays unavailable until every blocking check passes. No
          request, order or charge is created.
        </p>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised/40 px-3 py-2">
      <dt className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[11px] leading-5 break-all text-ink-secondary ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  success = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  success?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span
        className={`min-w-0 text-right ${
          success
            ? "font-medium text-success"
            : accent
              ? "font-medium text-ink"
              : "text-ink-secondary"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function IntentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 text-ink-muted">{label}</span>
      <span className="min-w-0 break-all text-ink-secondary">{value}</span>
    </div>
  );
}
