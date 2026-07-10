"use client";

import { dictionary, type Locale } from "@/lib/i18n";
import { usePushSubscription } from "./usePushSubscription";

export function PushSubscribe({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const { supported, subscribed, busy, subscribe, unsubscribe } = usePushSubscription(locale);

  return (
    <button
      className={`push-subscribe${subscribed ? " is-active" : ""}`}
      type="button"
      disabled={busy || !supported}
      onClick={subscribed ? unsubscribe : subscribe}
      aria-label={subscribed ? t.pushSubscribedLabel : t.pushSubscribeLabel}
      title={supported ? (subscribed ? t.pushSubscribedLabel : t.pushSubscribeLabel) : t.pushSubscribeLabel}
    >
      <span aria-hidden="true">{subscribed ? "🔔" : "🔕"}</span>
      <strong>{subscribed ? t.pushSubscribedLabel : t.pushSubscribeLabel}</strong>
    </button>
  );
}
