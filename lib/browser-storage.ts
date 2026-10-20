/**
 * The one place that touches window.localStorage. Client-safe (no Node
 * built-ins) and SSR-safe: every function no-ops on the server and survives
 * storage being blocked (Safari private mode, disabled cookies, quota).
 *
 * Shaped for React's useSyncExternalStore (see components/useStoredValue.ts):
 * - readStoredValue returns the SAME reference until the raw string changes,
 *   so React doesn't loop on "snapshot changed".
 * - writes notify subscribers in this tab directly; other tabs are picked up
 *   through the native "storage" event.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();
let crossTabListenerAttached = false;

export function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  try {
    return getBrowserStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function handleCrossTabChange(event: StorageEvent) {
  // key === null means localStorage.clear() in another tab — everything changed.
  if (event.key === null) {
    listeners.forEach((_, key) => notify(key));
  } else {
    notify(event.key);
  }
}

export function subscribeToStoredValue(key: string, listener: Listener): () => void {
  if (typeof window === "undefined") return () => undefined;

  if (!crossTabListenerAttached) {
    window.addEventListener("storage", handleCrossTabChange);
    crossTabListenerAttached = true;
  }

  const keyListeners = listeners.get(key) ?? new Set<Listener>();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
  };
}

/**
 * Parses and validates the stored JSON. Anything missing, corrupted or
 * hand-edited into the wrong shape falls back instead of crashing the page.
 */
export function readStoredValue<T>(key: string, fallback: T, parse: (value: unknown) => T | null): T {
  const raw = readRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw !== null) {
    try {
      value = parse(JSON.parse(raw)) ?? fallback;
    } catch {
      value = fallback;
    }
  }

  snapshotCache.set(key, { raw, value });
  return value;
}

/** Returns false when the browser refused the write (blocked storage, quota). */
export function writeStoredValue<T>(key: string, value: T): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }

  notify(key);
  return true;
}

export function removeStoredValue(key: string) {
  try {
    getBrowserStorage()?.removeItem(key);
  } catch {
    return;
  }
  notify(key);
}
