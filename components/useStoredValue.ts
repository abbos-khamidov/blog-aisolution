"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStoredValue, removeStoredValue, subscribeToStoredValue, writeStoredValue } from "@/lib/browser-storage";

type Updater<T> = T | ((previous: T) => T);

/**
 * localStorage-backed state without hydration mismatches: the server render
 * and the first client render both use `fallback`, then React swaps in the
 * stored value. Components sharing a key stay in sync (same tab and across
 * tabs), e.g. the bookmark button and the header "Saved" counter.
 *
 * `fallback` and `parse` must be stable (module-level), otherwise the
 * snapshot functions change every render.
 */
export function useStoredValue<T>(key: string, fallback: T, parse: (value: unknown) => T | null) {
  const subscribe = useCallback((listener: () => void) => subscribeToStoredValue(key, listener), [key]);
  const getSnapshot = useCallback(() => readStoredValue(key, fallback, parse), [key, fallback, parse]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: Updater<T>) => {
      // Read fresh instead of closing over `value`: two quick clicks must
      // both see the latest stored state.
      const previous = readStoredValue(key, fallback, parse);
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
      return writeStoredValue(key, resolved);
    },
    [key, fallback, parse]
  );

  const clear = useCallback(() => removeStoredValue(key), [key]);

  return [value, setValue, clear] as const;
}

const subscribeNoop = () => () => undefined;

/** false during SSR and the hydration pass, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}
