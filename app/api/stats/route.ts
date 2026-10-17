import { NextResponse } from "next/server";
import { isVisitorId, recordPing } from "@/lib/live-stats";

export const dynamic = "force-dynamic";

/** The browser pings every ~25 s while the tab is open; the answer is the live counters. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !isVisitorId(body.id)) {
    return NextResponse.json({ error: "Invalid visitor id" }, { status: 400 });
  }
  try {
    return NextResponse.json(recordPing(body.id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stats unavailable" }, { status: 503 });
  }
}
