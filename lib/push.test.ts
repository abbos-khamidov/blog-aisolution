import { describe, expect, it } from "vitest";
import { applyChanges, isValidPushEndpoint, isValidPushKey, MAX_SUBSCRIPTIONS, type PushSubscriptionRecord } from "./push";

const sub = (n: number): PushSubscriptionRecord => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${n}`, keys: { p256dh: "BNcR", auth: "a1" }, locale: "uz" });

describe("push subscriptions", () => {
  it("accepts only real browser push services (no SSRF to internal hosts)", () => {
    expect(isValidPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isValidPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isValidPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isValidPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc")).toBe(true);
    for (const bad of ["http://127.0.0.1:8000/admin", "https://localhost/x", "https://fcm.googleapis.com.evil.example/x", "http://fcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x", 42]) {
      expect(isValidPushEndpoint(bad)).toBe(false);
    }
    expect(isValidPushKey("BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQ")).toBe(true);
    expect(isValidPushKey("<script>")).toBe(false);
  });

  it("merges queued changes and never grows past the cap", () => {
    const current = [sub(1), sub(2)];
    const next = applyChanges(current, [sub(3), sub(1)], [sub(2).endpoint]);
    expect(next.map((s) => s.endpoint)).toEqual([sub(1).endpoint, sub(3).endpoint]);
    const full = Array.from({ length: MAX_SUBSCRIPTIONS }, (_, i) => sub(i));
    expect(applyChanges(full, [sub(MAX_SUBSCRIPTIONS + 1)], []).length).toBe(MAX_SUBSCRIPTIONS);
  });
});
