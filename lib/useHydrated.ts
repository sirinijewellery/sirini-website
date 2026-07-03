"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True after client hydration, false during SSR and the hydration render.
 * The canonical guard for UI that depends on client-only state (persisted
 * Zustand stores, localStorage) — replaces the setState-in-effect pattern.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
