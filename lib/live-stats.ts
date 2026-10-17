import fs from "node:fs";
import path from "node:path";

/**
 * Header counters: how many people are on the site right now and how many
 * different browsers have ever opened it. Stored in data/ next to the push
 * subscriptions (same folder, already git-ignored), so both PM2 instances
 * read and write the same numbers.
 *
 * A visitor is an anonymous random id the browser keeps in localStorage —
 * no cookies, no IP addresses, nothing personal.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const STATS_FILE = path.join(DATA_DIR, "live-stats.json");

/** A browser counts as "online" if it pinged within this window. */
export const ONLINE_WINDOW_MS = 60_000;
/** Browsers ping a bit faster than the window so an open tab never drops out. */
export const PING_INTERVAL_MS = 25_000;

const VISITOR_ID = /^[a-z0-9-]{8,64}$/;

type StatsFile = {
  /** visitor id → first time seen (ms) */
  visitors: Record<string, number>;
  /** visitor id → last ping (ms); old entries are pruned on every write */
  lastSeen: Record<string, number>;
};

export type LiveStats = { online: number; visitors: number };

export function isVisitorId(value: unknown): value is string {
  return typeof value === "string" && VISITOR_ID.test(value);
}

function emptyStats(): StatsFile {
  return { visitors: {}, lastSeen: {} };
}

function readStats(): StatsFile {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATS_FILE, "utf8")) as Partial<StatsFile>;
    return {
      visitors: parsed.visitors && typeof parsed.visitors === "object" ? parsed.visitors : {},
      lastSeen: parsed.lastSeen && typeof parsed.lastSeen === "object" ? parsed.lastSeen : {}
    };
  } catch {
    return emptyStats();
  }
}

function writeStats(stats: StatsFile) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // Write-then-rename so a reader in the other PM2 instance never sees half a file.
  const tmp = `${STATS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(stats));
  fs.renameSync(tmp, STATS_FILE);
}

/** Pure part, unit-tested: register a ping and count. */
export function applyPing(stats: StatsFile, visitorId: string, now: number): { next: StatsFile; result: LiveStats } {
  const visitors = { ...stats.visitors };
  if (!(visitorId in visitors)) visitors[visitorId] = now;

  const lastSeen: Record<string, number> = {};
  for (const [id, seen] of Object.entries(stats.lastSeen)) {
    if (now - seen < ONLINE_WINDOW_MS) lastSeen[id] = seen;
  }
  lastSeen[visitorId] = now;

  return {
    next: { visitors, lastSeen },
    result: { online: Object.keys(lastSeen).length, visitors: Object.keys(visitors).length }
  };
}

export function recordPing(visitorId: string, now = Date.now()): LiveStats {
  const { next, result } = applyPing(readStats(), visitorId, now);
  writeStats(next);
  return result;
}
