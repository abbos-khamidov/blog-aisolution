import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  serviceLink: string;
};

/**
 * Renders only when a post's frontmatter has `serviceLink` — this is the
 * one element that turns blog traffic into a lead, see claude.md, задача 6.
 * Plain <a>, no rel: it's a same-organization link to aisolution.uz.
 */
export function ServiceCta({ locale, serviceLink }: Props) {
  const t = dictionary[locale];

  return (
    <section className="service-cta">
      <div>
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaCopy}</p>
      </div>
      <a className="button primary" href={`https://aisolution.uz${serviceLink}`}>
        {t.ctaButton}
      </a>
    </section>
  );
}
