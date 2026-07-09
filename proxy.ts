import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/ru";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/"
};
