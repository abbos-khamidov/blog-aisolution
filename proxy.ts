import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Sends "/" to the Russian homepage with a RELATIVE Location ("/ru"), so the
 * browser keeps whatever host the visitor used. It must not build an absolute
 * URL from Host / X-Forwarded-Host (client-controlled) — that would let
 * "X-Forwarded-Host: evil.com" 308-redirect visitors off-site (open redirect).
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  return new NextResponse(null, { status: 308, headers: { Location: "/ru" } });
}

export const config = {
  matcher: "/"
};
