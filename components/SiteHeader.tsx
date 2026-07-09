import Link from "next/link";
import { Brand } from "./Brand";
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
          <a href="#radar">{t.navRadar}</a>
          <a href="#feed">{t.navFeed}</a>
          <a href="#position">{t.navPosition}</a>
        </nav>
      )}
      <div className="lang-switch" aria-label="Language">
        <Link className={locale === "ru" ? "is-active" : ""} href="/ru">
          RU
        </Link>
        <Link className={locale === "uz" ? "is-active" : ""} href="/uz">
          UZ
        </Link>
      </div>
    </header>
  );
}
