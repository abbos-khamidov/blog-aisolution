import fs from "node:fs";
import path from "node:path";
import { resolveDataDir } from "./data-dir";

/**
 * Header counters: how many people are on the site right now and how many
 * different browsers have ever opened it.
 *
 * Every open tab pings about every 25 s, so this runs a lot. Counting happens
 * in memory (O(1) per ping); the shared file in the data dir is merged and
 * written at most once per SYNC_MS per process. Before, every ping read and
 * rewrote the whole file synchronously, which blocked the Node event loop
 * (all pages, not just this API) once a few hundred people were online.
 *
 * Both PM2 instances merge through the same file, so their numbers agree
 * within a few seconds. A visitor is an anonymous random id the browser keeps
 * in localStorage — no cookies, no IP addresses, nothing personal.
 */

const STATS_FILE = path.join(resolveDataDir(), "live-stats.json");

/** A browser counts as "online" if it pinged within this window. */
export const ONLINE_WINDOW_MS = 60_000;
/** Browsers ping a bit faster than the window so an open tab never drops out. */
export const PING_INTERVAL_MS = 25_000;
/** How often a process merges its counts into the shared file. */
export const SYNC_MS = 5_000;

const VISITOR_ID = /^[a-z0-9-]{8,64}$/;

type StatsFile = {
  /** visitor id → first time seen (ms) */
  visitors: Record<string, number>;
  /** visitor id → last ping (ms); old entries are pruned on every sync */
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
  fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
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

/** Pure, unit-tested: union of two snapshots (earliest first-seen, latest ping), stale pings dropped. */
export function mergeStats(a: StatsFile, b: StatsFile, now: number): StatsFile {
  const visitors: Record<string, number> = { ...a.visitors };
  for (const [id, first] of Object.entries(b.visitors)) {
    if (!(id in visitors) || first < visitors[id]) visitors[id] = first;
  }
  const lastSeen: Record<string, number> = {};
  for (const source of [a.lastSeen, b.lastSeen]) {
    for (const [id, seen] of Object.entries(source)) {
      if (now - seen < ONLINE_WINDOW_MS && (!(id in lastSeen) || seen > lastSeen[id])) lastSeen[id] = seen;
    }
  }
  return { visitors, lastSeen };
}

/* ---------- per-process state ---------- */

let memory: StatsFile | null = null;
let visitorCount = 0;
let lastSync = 0;

function countOnline(stats: StatsFile, now: number): number {
  let online = 0;
  for (const seen of Object.values(stats.lastSeen)) if (now - seen < ONLINE_WINDOW_MS) online++;
  return online;
}

function sync(now: number) {
  memory = mergeStats(readStats(), memory ?? emptyStats(), now);
  visitorCount = Object.keys(memory.visitors).length;
  writeStats(memory);
  lastSync = now;
}

export function recordPing(visitorId: string, now = Date.now()): LiveStats {
  if (!memory) {
    memory = readStats();
    visitorCount = Object.keys(memory.visitors).length;
    lastSync = now;
  }
  // Mutate in place: copying the whole visitor map on every ping is what made this slow.
  if (!(visitorId in memory.visitors)) {
    memory.visitors[visitorId] = now;
    visitorCount++;
  }
  memory.lastSeen[visitorId] = now;

  if (now - lastSync >= SYNC_MS) {
    try {
      sync(now);
    } catch (error) {
      // A failed write must not break the counter; it retries on the next sync.
      lastSync = now;
      console.error("[live-stats] sync failed:", (error as Error).message);
    }
  }
  return { online: countOnline(memory, now), visitors: visitorCount };
}

/** Test hook: forget the in-memory state. */
export function resetLiveStatsForTests() {
  memory = null;
  visitorCount = 0;
  lastSync = 0;
}
