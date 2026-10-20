import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAdminConfig, SESSION_COOKIE, verifySessionToken } from "./auth";

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

/**
 * Blocks requests sent from another website (CSRF): a write is only accepted
 * when the browser says it came from this same host.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
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
  if (!verifySessionToken(token, config.sessionSecret)) return deny(401, "Login required");
  return null;
}

/** For admin pages (server components). */
export async function isAdminSession(): Promise<boolean> {
  const config = readAdminConfig();
  if (!config) return false;
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, config.sessionSecret);
}
