import { describe, expect, it } from "vitest";
import { createSessionToken, GlobalLoginLimiter, hashPassword, LoginLimiter, MAX_FAILED_LOGINS_GLOBAL, sessionKey, LOCKOUT_MS, MAX_FAILED_LOGINS, readAdminConfig, SESSION_TTL_SECONDS, verifyPassword, verifyPasswordAsync, verifySessionToken } from "./auth";

const SECRET = "x".repeat(40);

describe("admin password", () => {
  it("accepts the right password and rejects others", () => {
    const stored = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("correct horse batterY", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("never stores the plain password and salts every hash", () => {
    const a = hashPassword("same-password-123");
    const b = hashPassword("same-password-123");
    expect(a.includes("same-password-123")).toBe(false);
    expect(a).not.toBe(b);
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("anything", "plaintext")).toBe(false);
  });
});

describe("admin session", () => {
  it("accepts its own fresh token", () => {
    expect(verifySessionToken(createSessionToken(SECRET), SECRET)).toBe(true);
  });

  it("rejects tokens signed with another secret, edited, or expired", () => {
    const token = createSessionToken(SECRET, 1_000);
    expect(verifySessionToken(token, "y".repeat(40), 2_000)).toBe(false);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ exp: 9e15 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`, SECRET, 2_000)).toBe(false);
    expect(verifySessionToken(`${payload}.${sig}`, SECRET, 1_000 + SESSION_TTL_SECONDS * 1000 + 1)).toBe(false);
    expect(verifySessionToken(undefined, SECRET)).toBe(false);
    expect(verifySessionToken("garbage", SECRET)).toBe(false);
  });
});

describe("admin config", () => {
  it("stays off unless both values are set and the secret is long enough", () => {
    expect(readAdminConfig({})).toBeNull();
    expect(readAdminConfig({ ADMIN_PASSWORD_HASH: "h", ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(readAdminConfig({ ADMIN_PASSWORD_HASH: "h", ADMIN_SESSION_SECRET: SECRET })).toEqual({ passwordHash: "h", sessionSecret: SECRET });
  });
});

describe("login limiter", () => {
  it("locks an IP after too many failures and unlocks after the window", () => {
    const limiter = new LoginLimiter();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) limiter.fail("1.2.3.4", 0);
    expect(limiter.isLocked("1.2.3.4", 10)).toBe(true);
    expect(limiter.isLocked("5.6.7.8", 10)).toBe(false);
    expect(limiter.isLocked("1.2.3.4", LOCKOUT_MS + 1)).toBe(false);
  });

  it("forgets failures after a successful login", () => {
    const limiter = new LoginLimiter();
    for (let i = 0; i < MAX_FAILED_LOGINS - 1; i++) limiter.fail("ip", 0);
    limiter.reset("ip");
    limiter.fail("ip", 0);
    expect(limiter.isLocked("ip", 1)).toBe(false);
  });
});

describe("password hash in .env files", () => {
  it("has no \"$\" (Next.js would expand it) and still verifies", () => {
    const stored = hashPassword("Juda-uzun-parol-2026");
    expect(stored.includes("$")).toBe(false);
    expect(stored.startsWith("scrypt:16384:")).toBe(true);
    expect(verifyPassword("Juda-uzun-parol-2026", stored)).toBe(true);
    expect(verifyPassword("Juda-uzun-parol-2026", stored.replaceAll(":", "$"))).toBe(true);
    expect(verifyPassword("noto'g'ri", stored)).toBe(false);
    expect(verifyPassword("Juda-uzun-parol-2026", "scrypt")).toBe(false);
  });
});


describe("session is tied to the password", () => {
  it("changing the password logs everyone out", () => {
    const before = { passwordHash: hashPassword("Eski-uzun-parol-1"), sessionSecret: SECRET };
    const token = createSessionToken(sessionKey(before), 1_000);
    expect(verifySessionToken(token, sessionKey(before), 2_000)).toBe(true);
    const after = { passwordHash: hashPassword("Yangi-uzun-parol-2"), sessionSecret: SECRET };
    expect(verifySessionToken(token, sessionKey(after), 2_000)).toBe(false);
  });
});

describe("GlobalLoginLimiter", () => {
  it("locks after too many failures from any IPs and unlocks after the window", () => {
    const g = new GlobalLoginLimiter();
    for (let i = 0; i < MAX_FAILED_LOGINS_GLOBAL - 1; i++) g.fail(1_000);
    expect(g.isLocked(1_000)).toBe(false);
    g.fail(1_000);
    expect(g.isLocked(1_000)).toBe(true);
    expect(g.isLocked(1_000 + LOCKOUT_MS + 1)).toBe(false);
  });
});

describe("verifyPasswordAsync", () => {
  it("gives the same answers as the sync check", async () => {
    const stored = hashPassword("Juda-uzun-parol-2026");
    expect(await verifyPasswordAsync("Juda-uzun-parol-2026", stored)).toBe(true);
    expect(await verifyPasswordAsync("noto'g'ri-parol", stored)).toBe(false);
    expect(await verifyPasswordAsync("Juda-uzun-parol-2026", "buzuq")).toBe(false);
  });
});
