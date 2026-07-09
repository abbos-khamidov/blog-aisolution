import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { defaultLocale, dictionary } from "@/lib/i18n";

/**
 * Locale-aware 404 for anything inside app/[locale] (bad slug, cluster, or
 * author) — without this Next falls back to its generic unstyled 404,
 * which is a dead end for both users and crawlers landing on broken links.
 * Locale can't be read from params here (Next's not-found convention takes
 * no props), so this always renders in the default locale.
 */
export default function NotFound() {
  const t = dictionary[defaultLocale];

  return (
    <>
      <SiteHeader locale={defaultLocale} compact />
      <main className="article-shell">
        <div className="section-head">
          <p className="kicker">404</p>
          <h1>{t.missing}</h1>
          <p className="section-copy">{t.notFoundCopy}</p>
        </div>
        <div className="hero-actions">
          <Link className="button primary" href={`/${defaultLocale}`}>
            {t.back}
          </Link>
          <Link className="button ghost" href={`/${defaultLocale}#feed`}>
            {t.navFeed}
          </Link>
        </div>
      </main>
    </>
  );
}
