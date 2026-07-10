import Link from "next/link";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";

type Props = {
  locale: Locale;
  compact?: boolean;
};

export function SiteHeader({ locale, compact = false }: Props) {
  const t = dictionary[locale];

  return (
    <header className={`site-header${compact ? " compact" : ""}`}>
      <Brand href={`/${locale}`} />
      {!compact && (
        <nav className="top-nav" aria-label="Primary navigation">
          <a href="#clusters">{t.navClusters}</a>
          <Link href={`/${locale}/opinion`}>{t.navOpinion}</Link>
          <Link className="nav-rating" href={`/${locale}/rating`}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 4h8v3.5c0 3.1-1.8 5.5-4 5.5S8 10.6 8 7.5V4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M8 6H4v1.5C4 10 5.7 12 8.2 12M16 6h4v1.5c0 2.5-1.7 4.5-4.2 4.5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 13v4M8.5 20h7M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {t.navRating}
          </Link>
          <a href="#position">{t.navPosition}</a>
        </nav>
      )}
      <div className="header-actions">
        <ThemeToggle />
        <div className="lang-switch" aria-label="Language">
          <Link className={locale === "ru" ? "is-active" : ""} href="/ru">
            RU
          </Link>
          <Link className={locale === "uz" ? "is-active" : ""} href="/uz">
            UZ
          </Link>
        </div>
      </div>
    </header>
  );
}
