"use client";

import { useCallback, useEffect, useState } from "react";

type LiveState<T> =
  | { status: "loading"; data: T | null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: T | null; error: string };

/**
 * Small fetch hook for dashboard sections backed by the app's own
 * registry API routes. Surfaces loading and error states explicitly —
 * data is never fabricated when a request fails. All state transitions
 * happen in async callbacks subscribed to the fetch result.
 */
export function useLive<T>(url: string) {
  const [state, setState] = useState<LiveState<T>>({
    status: "loading",
    data: null,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const settle = (next: LiveState<T>) => {
      if (!cancelled) setState(next);
    };

    fetch(url, { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (T & { error?: string })
          | null;
        if (!res.ok) {
          settle({
            status: "error",
            data: null,
            error: body?.error ?? `Request failed (HTTP ${res.status})`,
          });
        } else if (body) {
          settle({ status: "ready", data: body, error: null });
        } else {
          settle({
            status: "error",
            data: null,
            error: "API route returned an empty response",
          });
        }
      })
      .catch(() => {
        settle({
          status: "error",
          data: null,
          error: "Network error while reaching the API route",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    data: state.data,
    error: state.status === "error" ? state.error : null,
    loading: state.status === "loading",
    reload,
  };
}
