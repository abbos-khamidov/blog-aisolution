import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

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

export function readAdminConfig(env: Record<string, string | undefined> = process.env): AdminConfig | null {
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = env.ADMIN_SESSION_SECRET?.trim();
  if (!passwordHash || !sessionSecret || sessionSecret.length < 32) return null;
  return { passwordHash, sessionSecret };
}

/* ---------- password ---------- */

/** "scrypt$<N>$<salt b64>$<hash b64>" — salt is random, so the same password gives a different hash every time. */
export function hashPassword(password: string): string {
  const salt = new Uint8Array(randomBytes(16));
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N });
  return `scrypt$${SCRYPT_N}$${Buffer.from(salt).toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !n || !saltB64 || !hashB64) return false;
  const expected = new Uint8Array(Buffer.from(hashB64, "base64"));
  const salt = new Uint8Array(Buffer.from(saltB64, "base64"));
  const actual = new Uint8Array(scryptSync(password, salt, expected.length, { N: Number(n) }));
  // timingSafeEqual: comparison time doesn't leak how many bytes matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
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
