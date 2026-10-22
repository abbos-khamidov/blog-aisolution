import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin/auth";
import { deny, isSameOrigin, noStore } from "@/lib/admin/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return deny(403, "Cross-site request blocked");
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
