import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";
import { resolveDataDir } from "./data-dir";
import type { Locale } from "./i18n";

const SUBSCRIPTIONS_FILE = path.join(resolveDataDir(), "push-subscriptions.json");

/** Hard cap so a flood of fake subscriptions can't grow the file (and memory) without end. */
export const MAX_SUBSCRIPTIONS = 50_000;
/** Pending changes are written in one batch at most this often. */
const FLUSH_DELAY_MS = 300;

export type PushSubscriptionRecord = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  locale: Locale;
};

/**
 * Real browser push services only. The server later POSTs to every stored
 * endpoint, so an arbitrary URL (http://127.0.0.1:8000/…) would let anyone
 * make the server call its own internal services (SSRF).
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)*push\.apple\.com$/, /^([a-z0-9-]+\.)*notify\.windows\.com$/];

export function isValidPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.port && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

export function isValidPushKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && /^[A-Za-z0-9_\-=+/]+$/.test(value);
}

/**
 * Never returns [] for a file that exists but can't be parsed: the old code did,
 * and the next write then replaced every subscription with an empty list.
 */
function readFileStrict(): PushSubscriptionRecord[] {
  let text: string;
  try {
    text = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("push-subscriptions.json is not a list");
  return parsed;
}

export function readSubscriptions(): PushSubscriptionRecord[] {
  try {
    return readFileStrict();
  } catch {
    return [];
  }
}

function writeAtomic(subscriptions: PushSubscriptionRecord[]) {
  fs.mkdirSync(path.dirname(SUBSCRIPTIONS_FILE), { recursive: true });
  // Write-then-rename: a reader (the other PM2 instance, the notify script) never sees a half-written file.
  const tmp = `${SUBSCRIPTIONS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(subscriptions));
  fs.renameSync(tmp, SUBSCRIPTIONS_FILE);
}

/* ---------- batched writes ----------
 * Requests only queue a change and answer at once; one timer per process merges
 * the queue into the file. Applying *changes* (not this process's whole list)
 * keeps the other PM2 instance's writes. */

const pendingAdds = new Map<string, PushSubscriptionRecord>();
const pendingRemoves = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function applyChanges(current: PushSubscriptionRecord[], adds: Iterable<PushSubscriptionRecord>, removes: Iterable<string>): PushSubscriptionRecord[] {
  const byEndpoint = new Map(current.map((sub) => [sub.endpoint, sub]));
  for (const endpoint of removes) byEndpoint.delete(endpoint);
  for (const sub of adds) {
    if (byEndpoint.has(sub.endpoint) || byEndpoint.size < MAX_SUBSCRIPTIONS) byEndpoint.set(sub.endpoint, sub);
  }
  return [...byEndpoint.values()];
}

export function flushSubscriptions() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (!pendingAdds.size && !pendingRemoves.size) return;
  const adds = [...pendingAdds.values()];
  const removes = [...pendingRemoves];
  pendingAdds.clear();
  pendingRemoves.clear();
  try {
    writeAtomic(applyChanges(readFileStrict(), adds, removes));
  } catch (error) {
    // Unreadable file or failed write: keep the changes and try again later, never overwrite with less.
    for (const sub of adds) if (!pendingAdds.has(sub.endpoint)) pendingAdds.set(sub.endpoint, sub);
    for (const endpoint of removes) pendingRemoves.add(endpoint);
    console.error("[push] could not save subscriptions:", (error as Error).message);
    scheduleFlush(5_000);
  }
}

function scheduleFlush(delay = FLUSH_DELAY_MS) {
  if (flushTimer) return;
  flushTimer = setTimeout(flushSubscriptions, delay);
  flushTimer.unref?.();
}

export function addSubscription(record: PushSubscriptionRecord) {
  pendingRemoves.delete(record.endpoint);
  pendingAdds.set(record.endpoint, record);
  scheduleFlush();
}

export function removeSubscription(endpoint: string) {
  pendingAdds.delete(endpoint);
  pendingRemoves.add(endpoint);
  scheduleFlush();
}

// PM2 restart/stop: save what's queued before the process exits.
// A SIGINT/SIGTERM listener disables Node's default "exit on signal", so after
// saving we send the signal again — with our listener gone, the process stops
// as before (or Next.js's own handler takes over).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    flushSubscriptions();
    process.kill(process.pid, signal);
  });
}
process.once("beforeExit", () => flushSubscriptions());

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Missing VAPID env vars: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Sends to every stored subscription for a locale. A 404/410 from the push
 * service means the browser subscription is gone for good (uninstalled,
 * expired) — prune it instead of retrying forever.
 */
export async function sendPushToLocale(
  locale: Locale,
  payload: { title: string; body: string; url: string }
): Promise<{ sent: number; removed: number }> {
  configureWebPush();
  const subscriptions = readSubscriptions().filter((sub) => sub.locale === locale);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          removeSubscription(sub.endpoint);
          removed += 1;
        }
      }
    })
  );

  flushSubscriptions();
  return { sent, removed };
}
