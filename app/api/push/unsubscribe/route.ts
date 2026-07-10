import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
