import { createHmac, randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Admin authentication. There is exactly one admin login, configured on the
 * server through two environment variables (see .env.example):
 *
 *   ADMIN_PASSWORD_HASH   — produced by `npm run admin:hash -- "<password>"`;
 *                           the plain password is never stored anywhere.
 *   ADMIN_SESSION_SECRET  — 32+ random characters, signs the session cookie.
 *
 * If either is missing the admin panel and its API stay switched off.
 */

export const SESSION_COOKIE = "ais_admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const SCRYPT_N = 16384;
const KEY_LENGTH = 64;

export type AdminConfig = { passwordHash: string; sessionSecret: string };

/**
 * Key that signs session cookies. It includes the password hash, so changing
 * the admin password instantly logs out every existing session.
 */
export function sessionKey(config: AdminConfig): string {
  return `${config.sessionSecret}\u0000${config.passwordHash}`;
}

export function readAdminConfig(env: Record<string, string | undefined> = process.env): AdminConfig | null {
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = env.ADMIN_SESSION_SECRET?.trim();
  if (!passwordHash || !sessionSecret || sessionSecret.length < 32) return null;
  return { passwordHash, sessionSecret };
}

/* ---------- password ---------- */

/**
 * "scrypt:<N>:<salt b64>:<hash b64>" — salt is random, so the same password gives a different hash every time.
 * ":" (not "$") on purpose: Next.js expands "$NAME" inside .env files, which would silently break a "$" hash.
 */
export function hashPassword(password: string): string {
  const salt = new Uint8Array(randomBytes(16));
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N });
  return `scrypt:${SCRYPT_N}:${Buffer.from(salt).toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, saltB64, hashB64] = stored.trim().split(/[:$]/); // "$" still accepted for hashes set via PM2 env
  if (scheme !== "scrypt" || !/^\d+$/.test(n ?? "") || !saltB64 || !hashB64) return false;
  const expected = new Uint8Array(Buffer.from(hashB64, "base64"));
  const salt = new Uint8Array(Buffer.from(saltB64, "base64"));
  const actual = new Uint8Array(scryptSync(password, salt, expected.length, { N: Number(n) }));
  // timingSafeEqual: comparison time doesn't leak how many bytes matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Same check without blocking: scrypt is deliberately slow (~40 ms), and the
 * sync version froze the whole server for that long on every login attempt.
 * This one runs in Node's thread pool, so pages keep answering during a
 * password-guessing flood. The login API uses this one.
 */
export function verifyPasswordAsync(password: string, stored: string): Promise<boolean> {
  const [scheme, n, saltB64, hashB64] = stored.trim().split(/[:$]/);
  if (scheme !== "scrypt" || !/^\d+$/.test(n ?? "") || !saltB64 || !hashB64) return Promise.resolve(false);
  const expected = new Uint8Array(Buffer.from(hashB64, "base64"));
  const salt = new Uint8Array(Buffer.from(saltB64, "base64"));
  return new Promise((resolve) => {
    scrypt(password, salt, expected.length, { N: Number(n) }, (error, key) => {
      if (error) return resolve(false);
      const actual = new Uint8Array(key);
      resolve(actual.length === expected.length && timingSafeEqual(actual, expected));
    });
  });
}

/* ---------- session token ---------- */

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** "<expiry b64url>.<signature>" — the browser can read it but can't forge or extend it. */
export function createSessionToken(secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_TTL_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = new TextEncoder().encode(sign(payload, secret));
  const actual = new TextEncoder().encode(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > now;
  } catch {
    return false;
  }
}

/* ---------- brute-force guard ---------- */

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

type Attempts = { count: number; first: number };

/** Per-IP failed-login counter. In memory, per server process — enough to make guessing impractical. */
export class LoginLimiter {
  private attempts = new Map<string, Attempts>();

  isLocked(ip: string, now = Date.now()): boolean {
    const entry = this.attempts.get(ip);
    if (!entry) return false;
    if (now - entry.first > LOCKOUT_MS) {
      this.attempts.delete(ip);
      return false;
    }
    return entry.count >= MAX_FAILED_LOGINS;
  }

  fail(ip: string, now = Date.now()) {
    const entry = this.attempts.get(ip);
    if (!entry || now - entry.first > LOCKOUT_MS) this.attempts.set(ip, { count: 1, first: now });
    else entry.count += 1;
  }

  reset(ip: string) {
    this.attempts.delete(ip);
  }
}

export const loginLimiter = new LoginLimiter();

/**
 * All failed logins together, whatever the IP. Stops slow guessing spread over
 * many addresses and skips the (deliberately slow) scrypt check while locked.
 * Trade-off: during an attack the real admin also waits up to 15 minutes.
 */
export const MAX_FAILED_LOGINS_GLOBAL = 30;

export class GlobalLoginLimiter {
  private fails: number[] = [];

  private prune(now: number) {
    this.fails = this.fails.filter((t) => now - t < LOCKOUT_MS);
  }

  isLocked(now = Date.now()): boolean {
    this.prune(now);
    return this.fails.length >= MAX_FAILED_LOGINS_GLOBAL;
  }

  fail(now = Date.now()) {
    this.prune(now);
    this.fails.push(now);
  }
}

export const globalLoginLimiter = new GlobalLoginLimiter();
