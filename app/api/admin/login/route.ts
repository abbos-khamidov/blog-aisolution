import { NextResponse } from "next/server";
import { createSessionToken, globalLoginLimiter, loginLimiter, readAdminConfig, SESSION_COOKIE, SESSION_TTL_SECONDS, sessionKey, verifyPasswordAsync } from "@/lib/admin/auth";
import { clientIp, deny, isSameOrigin, noStore } from "@/lib/admin/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = readAdminConfig();
  if (!config) return deny(503, "Admin panel is not configured on this server");
  if (!isSameOrigin(request)) return deny(403, "Cross-site request blocked");

  const ip = clientIp(request);
  if (loginLimiter.isLocked(ip) || globalLoginLimiter.isLocked()) return deny(429, "Too many failed attempts. Try again in 15 minutes.");
  // Count the attempt right after the check, before any await: otherwise 100
  // parallel guesses all pass isLocked() before the first failure is recorded.
  // A correct password clears the IP's count below.
  loginLimiter.fail(ip);
  globalLoginLimiter.fail();

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 200 || !(await verifyPasswordAsync(password, config.passwordHash))) {
    return deny(401, "Wrong password");
  }

  loginLimiter.reset(ip);
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, createSessionToken(sessionKey(config)), {
    httpOnly: true, // JavaScript on the page can't read it
    secure: process.env.NODE_ENV === "production", // https only on the real site
    sameSite: "strict", // never sent with requests from other sites
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return response;
}
