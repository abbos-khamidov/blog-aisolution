import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPostCard } from "@/components/ContentPostCard";
import { SiteHeader } from "@/components/SiteHeader";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { getRatedPosts } from "@/lib/content";
import { buildWebsiteGraph } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = dictionary[locale];

  return {
    title: t.ratingTitle,
    description: t.ratingCopy,
    alternates: {
      canonical: `/${locale}/rating`,
      languages: {
        ru: "/ru/rating",
        uz: "/uz/rating",
        "x-default": "/ru/rating"
      }
    }
  };
}

export default async function RatingPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const posts = getRatedPosts(locale);
  const graph = buildWebsiteGraph();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <SiteHeader locale={locale} compact />
      <main className="article-shell rating-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.back}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{t.navRating}</span>
        </nav>

        <div className="section-head rating-head">
          <span className="rating-cup" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8 4h8v3.5c0 3.1-1.8 5.5-4 5.5S8 10.6 8 7.5V4Z" stroke="currentColor" strokeWidth="2" />
              <path d="M8 6H4v1.5C4 10 5.7 12 8.2 12M16 6h4v1.5c0 2.5-1.7 4.5-4.2 4.5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 13v4M8.5 20h7M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <h1>{t.ratingTitle}</h1>
          <p className="section-copy">{t.ratingCopy}</p>
        </div>

        <section className="rating-method">
          <div className="section-head split">
            <div>
              <p className="kicker">{t.ratingMethodKicker}</p>
              <h2>{t.ratingMethodTitle}</h2>
              <p className="section-copy">{t.ratingMethodCopy}</p>
            </div>
          </div>
          <div className="rating-method-grid">
            <p>{t.ratingMethodPoint1}</p>
            <p>{t.ratingMethodPoint2}</p>
            <p>{t.ratingMethodPoint3}</p>
            <p>{t.ratingMethodPoint4}</p>
          </div>
        </section>

        <div className="post-grid">
          {posts.map((post) => (
            <ContentPostCard key={post.slug} post={post} locale={locale} />
          ))}
        </div>
      </main>
    </>
  );
}
