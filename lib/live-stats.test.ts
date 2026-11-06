import { describe, expect, it } from "vitest";
import { applyPing, isVisitorId, mergeStats, ONLINE_WINDOW_MS } from "./live-stats";

describe("live stats", () => {
  it("counts each browser once and keeps only recent pings online", () => {
    const empty = { visitors: {}, lastSeen: {} };
    const a = applyPing(empty, "visitor-aaaa", 1_000);
    expect(a.result).toEqual({ online: 1, visitors: 1 });

    const b = applyPing(a.next, "visitor-bbbb", 2_000);
    expect(b.result).toEqual({ online: 2, visitors: 2 });

    const again = applyPing(b.next, "visitor-aaaa", 3_000);
    expect(again.result.visitors).toBe(2);

    const later = applyPing(again.next, "visitor-cccc", 2_000 + ONLINE_WINDOW_MS + 1);
    expect(later.result).toEqual({ online: 2, visitors: 3 });
  });

  it("accepts only short safe ids", () => {
    expect(isVisitorId("3f2a9c1e-77b0-4d2e-9a51-7c0b1e2f3a4b")).toBe(true);
    expect(isVisitorId("../../etc/passwd")).toBe(false);
    expect(isVisitorId("short")).toBe(false);
    expect(isVisitorId(42)).toBe(false);
  });
});

describe("mergeStats (two PM2 instances share one file)", () => {
  it("keeps every visitor once, the earliest first visit and the latest ping", () => {
    const now = 100_000;
    const a = { visitors: { "visitor-aaaa": 10, "visitor-bbbb": 50 }, lastSeen: { "visitor-aaaa": now - 1_000 } };
    const b = { visitors: { "visitor-bbbb": 20, "visitor-cccc": 30 }, lastSeen: { "visitor-aaaa": now - 500, "visitor-cccc": now - ONLINE_WINDOW_MS - 1 } };
    const merged = mergeStats(a, b, now);
    expect(Object.keys(merged.visitors).length).toBe(3);
    expect(merged.visitors["visitor-bbbb"]).toBe(20);
    expect(merged.lastSeen["visitor-aaaa"]).toBe(now - 500);
    expect("visitor-cccc" in merged.lastSeen).toBe(false);
  });
});
