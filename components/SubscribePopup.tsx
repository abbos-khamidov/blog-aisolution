"use client";

import { useEffect, useState } from "react";
import { dictionary, type Locale } from "@/lib/i18n";
import { usePushSubscription } from "./usePushSubscription";

const DISMISS_KEY = "aisolution-subscribe-popup-dismissed";
const DELAY_MS = 15000;

export function SubscribePopup({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const { supported, subscribed, busy, subscribe } = usePushSubscription(locale);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!supported || subscribed) return undefined;
    if (localStorage.getItem(DISMISS_KEY)) return undefined;

    const timer = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [supported, subscribed]);

  useEffect(() => {
    if (subscribed) setVisible(false);
  }, [subscribed]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleSubscribe() {
    const granted = await subscribe();
    if (granted) {
      localStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="subscribe-popup" role="dialog" aria-live="polite" aria-label={t.popupTitle}>
      <button className="subscribe-popup-close" type="button" onClick={dismiss} aria-label={t.popupClose}>
        ×
      </button>
      <span className="kicker">{t.popupKicker}</span>
      <strong>{t.popupTitle}</strong>
      <p>{t.popupCopy}</p>
      <button className="button primary" type="button" disabled={busy} onClick={handleSubscribe}>
        {t.popupCta}
      </button>
    </div>
  );
}
