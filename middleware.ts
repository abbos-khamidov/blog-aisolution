import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Sends "/" to the Russian homepage. The Location is RELATIVE ("/ru"), so the
 * browser resolves it against whatever host the visitor actually used.
 *
 * It must NOT build an absolute URL from the Host / X-Forwarded-Host header:
 * those come from the client, so a request with "X-Forwarded-Host: evil.com"
 * would make the site 308-redirect visitors to https://evil.com/ru (an open
 * redirect, and poisonable once "/" is cached).
 */
// Fixed, trusted origin. Next parses the Location header with new URL(), so a
// bare "/ru" throws "Invalid URL" (500). Never derive this from request headers.
const SITE_ORIGIN = "https://blog.aisolution.uz";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/ru", SITE_ORIGIN), 308);
}

export const config = {
  matcher: "/"
};
