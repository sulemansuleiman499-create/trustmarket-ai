"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { detectConcordiumProvider } from "@concordium/browser-wallet-api-helpers";
import { OWN_AGENT } from "@/lib/concordium/constants";

/**
 * Connected-account store backed by localStorage. The dashboard only
 * ever holds the public account address the user chose to share in the
 * wallet — keys and recovery phrases never leave the wallet extension.
 */
const STORAGE_KEY = "tm-connected-account";
const EVENT = "tm-connected-account-changed";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function setStoredAccount(account: string | null) {
  if (account) window.localStorage.setItem(STORAGE_KEY, account);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

type ConnectState = "idle" | "connecting" | "missing-extension" | "rejected";

interface WalletContextValue {
  account: string | null;
  connectState: ConnectState;
  /** Account used for registry lookups: connected wallet or recorded fallback. */
  lookupAccount: string;
  isFallback: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const account = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const [connectState, setConnectState] = useState<ConnectState>("idle");

  const connect = useCallback(async () => {
    setConnectState("connecting");
    // detectConcordiumProvider rejects with no argument when the extension
    // never injects window.concordium within the timeout.
    let provider;
    try {
      provider = await detectConcordiumProvider(3_000);
    } catch {
      setConnectState("missing-extension");
      return;
    }
    try {
      const accounts = await provider.requestAccounts();
      if (accounts.length > 0) {
        setStoredAccount(accounts[0]);
        setConnectState("idle");
      } else {
        setConnectState("rejected");
      }
    } catch {
      setConnectState("rejected");
    }
  }, []);

  const disconnect = useCallback(() => {
    setStoredAccount(null);
    setConnectState("idle");
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      account,
      connectState,
      lookupAccount: account ?? OWN_AGENT.ownerAccount,
      isFallback: account === null,
      connect,
      disconnect,
    }),
    [account, connectState, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
