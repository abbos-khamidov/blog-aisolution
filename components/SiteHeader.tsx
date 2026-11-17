import Link from "next/link";
import { Brand } from "./Brand";
import { PushSubscribe } from "./PushSubscribe";
import { SavedLink } from "./SavedLink";
import { ThemeToggle } from "./ThemeToggle";
import { LiveStats } from "./live/LiveStats";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";

type Props = {
  locale: Locale;
  /** Kept for API compatibility with existing pages; the nav is shown everywhere now. */
  compact?: boolean;
  /**
   * Where the RU/UZ switch leads from this page. An article passes its
   * translation's URL; a locale without an entry falls back to its homepage.
   */
  alternates?: Partial<Record<Locale, string>>;
};

const TELEGRAM_URL = "https://t.me/blogaisolution";

export function SiteHeader({ locale, alternates = {} }: Props) {
  const t = dictionary[locale];

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Brand href={`/${locale}`} />
        <nav className="top-nav" aria-label="Primary navigation">
          <Link href={`/${locale}#feed`}>{t.navFeed}</Link>
          <Link href={`/${locale}/rating`}>{t.navRating}</Link>
          <Link href={`/${locale}/opinion`}>{t.navOpinion}</Link>
          <Link href={`/${locale}#clusters`}>{t.navClusters}</Link>
        </nav>
        <div className="header-actions">
          <a
            className="telegram-link"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.navTelegram}
            title={t.navTelegram}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 4.5 2.9 11.4c-.9.4-.9 1.6.1 1.9l4.5 1.4 1.7 5.3c.2.7 1.1.9 1.6.4l2.5-2.3 4.6 3.4c.6.4 1.4.1 1.6-.6L22.2 5.6c.2-.8-.5-1.4-1.2-1.1Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="m7.5 14.7 9.8-6.4-7.6 7.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </a>
          <LiveStats onlineLabel={t.statsOnline} visitorsLabel={t.statsVisitors} />
          <PushSubscribe locale={locale} />
          <SavedLink locale={locale} />
          <ThemeToggle />
          <div className="lang-switch" aria-label="Language">
            <Link className={locale === "ru" ? "is-active" : ""} href={alternates.ru ?? "/ru"} hrefLang="ru">
              RU
            </Link>
            <Link className={locale === "uz" ? "is-active" : ""} href={alternates.uz ?? "/uz"} hrefLang="uz">
              UZ
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
