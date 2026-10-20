import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, LoginLimiter, LOCKOUT_MS, MAX_FAILED_LOGINS, readAdminConfig, SESSION_TTL_SECONDS, verifyPassword, verifySessionToken } from "./auth";

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
