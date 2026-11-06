import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Sends "/" to the Russian homepage with a RELATIVE Location ("/ru"), so the
 * browser keeps whatever host the visitor used. It must not build an absolute
 * URL from Host / X-Forwarded-Host (client-controlled) — that would let
 * "X-Forwarded-Host: evil.com" 308-redirect visitors off-site (open redirect).
 */
// Fixed, trusted origin. Next parses the Location header with new URL(), so a
// bare "/ru" throws "Invalid URL" (500). Never derive this from request headers.
const SITE_ORIGIN = "https://blog.aisolution.uz";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/ru", SITE_ORIGIN), 308);
}

export const config = {
  matcher: "/"
};
