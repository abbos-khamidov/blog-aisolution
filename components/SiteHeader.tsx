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
};

export function SiteHeader({ locale }: Props) {
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
          <LiveStats onlineLabel={t.statsOnline} visitorsLabel={t.statsVisitors} />
          <PushSubscribe locale={locale} />
          <SavedLink locale={locale} />
          <ThemeToggle />
          <div className="lang-switch" aria-label="Language">
            <Link className={locale === "ru" ? "is-active" : ""} href="/ru" hrefLang="ru">
              RU
            </Link>
            <Link className={locale === "uz" ? "is-active" : ""} href="/uz" hrefLang="uz">
              UZ
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
