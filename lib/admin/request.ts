import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAdminConfig, SESSION_COOKIE, sessionKey, verifySessionToken } from "./auth";

/**
 * The visitor's real IP for the login limiter. Nginx sets X-Real-IP to
 * $remote_addr (a client can't fake it). In X-Forwarded-For only the LAST entry
 * is added by our proxy — earlier entries are whatever the client sent, so
 * trusting the first one would let an attacker pick a new "IP" per attempt.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded?.at(-1) || "local";
}

/**
 * Blocks requests sent from another website (CSRF): a write is only accepted
 * when the browser says it came from this same host.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  // Host is set by nginx ($host); X-Forwarded-Host isn't, so a client could send any value there.
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export function deny(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: noStore });
}

/** For API routes: null when the caller is the logged-in admin, otherwise the error response to return. */
export async function requireAdmin(request: Request, { write = false } = {}): Promise<NextResponse | null> {
  const config = readAdminConfig();
  if (!config) return deny(503, "Admin panel is not configured on this server");
  if (write && !isSameOrigin(request)) return deny(403, "Cross-site request blocked");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token, sessionKey(config))) return deny(401, "Login required");
  return null;
}

/** For admin pages (server components). */
export async function isAdminSession(): Promise<boolean> {
  const config = readAdminConfig();
  if (!config) return false;
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, sessionKey(config));
}
