import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";
import type { Locale } from "./i18n";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

export type PushSubscriptionRecord = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  locale: Locale;
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readSubscriptions(): PushSubscriptionRecord[] {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeSubscriptions(subscriptions: PushSubscriptionRecord[]) {
  ensureDataDir();
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
}

export function addSubscription(record: PushSubscriptionRecord) {
  const subscriptions = readSubscriptions().filter((sub) => sub.endpoint !== record.endpoint);
  subscriptions.push(record);
  writeSubscriptions(subscriptions);
}

export function removeSubscription(endpoint: string) {
  writeSubscriptions(readSubscriptions().filter((sub) => sub.endpoint !== endpoint));
}

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

  return { sent, removed };
}
