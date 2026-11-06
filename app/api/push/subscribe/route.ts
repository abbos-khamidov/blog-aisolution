import { NextResponse } from "next/server";
import { addSubscription, isValidPushEndpoint, isValidPushKey } from "@/lib/push";
import { locales } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !isValidPushEndpoint(body.endpoint) ||
    !isValidPushKey(body.keys?.p256dh) ||
    !isValidPushKey(body.keys?.auth) ||
    !locales.includes(body.locale)
  ) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  addSubscription({
    endpoint: body.endpoint,
    keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    locale: body.locale
  });

  return NextResponse.json({ ok: true });
}
