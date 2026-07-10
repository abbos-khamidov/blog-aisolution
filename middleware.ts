import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/ru", "https://blog.aisolution.uz"), 308);
}

export const config = {
  matcher: "/"
};
