import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPostCard } from "@/components/ContentPostCard";
import { SiteHeader } from "@/components/SiteHeader";
import { clusterMeta, getOpinionPosts } from "@/lib/content";
import { listAuthors } from "@/lib/authors";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
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
    title: t.opinionTitle,
    description: t.opinionCopy,
    alternates: {
      canonical: `/${locale}/opinion`,
      languages: {
        ru: "/ru/opinion",
        uz: "/uz/opinion",
        "x-default": "/ru/opinion"
      }
    }
  };
}

export default async function OpinionPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const graph = buildWebsiteGraph();
  const posts = getOpinionPosts(locale);
  const authors = listAuthors().filter((author) => posts.some((post) => post.author === author.key));

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <SiteHeader locale={locale} compact />
      <main className="article-shell opinion-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.back}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{t.navOpinion}</span>
        </nav>

        <div className="section-head opinion-head">
          <p className="kicker">{t.opinionKicker}</p>
          <h1>{t.opinionTitle}</h1>
          <p className="section-copy">{t.opinionCopy}</p>
        </div>

        <section className="opinion-section">
          <div className="section-head split">
            <div>
              <h2>{t.opinionCta}</h2>
              <p className="section-copy">{clusterMeta.mnenie.description[locale]}</p>
            </div>
          </div>
          <div className="post-grid">
            {posts.map((post) => (
              <ContentPostCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
        </section>

        <section className="opinion-section" id="people">
          <div className="section-head split">
            <div>
              <p className="kicker">{locale === "ru" ? "по людям" : "odamlar bo'yicha"}</p>
              <h2>{locale === "ru" ? "Кто говорит" : "Kim gapiradi"}</h2>
              <p className="section-copy">{t.opinionCopy}</p>
            </div>
            <Link className="button ghost" href={`/${locale}#opinion`}>
              {t.opinionCta}
            </Link>
          </div>
          <div className="opinion-people-grid">
            {authors.map((author) => {
              const authorPosts = posts.filter((post) => post.author === author.key);
              const countLabel =
                locale === "ru" ? `${authorPosts.length} ${authorPosts.length === 1 ? "мнение" : "мнений"}` : `${authorPosts.length} fikr`;
              return (
                <Link key={author.key} className="opinion-voice-card" href={`/${locale}/authors/${author.key}`}>
                  <Image className="opinion-voice-avatar" src={author.image} alt={author.name[locale]} width={72} height={72} />
                  <div>
                    <strong>{author.name[locale]}</strong>
                    <p>{author.role[locale]}</p>
                    <small>{countLabel}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="opinion-section" id="directions">
          <div className="section-head split">
            <div>
              <p className="kicker">{locale === "ru" ? "по направлениям" : "yo'nalishlar bo'yicha"}</p>
              <h2>{locale === "ru" ? "Где разложены темы" : "Mavzular qayerda ajraladi"}</h2>
              <p className="section-copy">{locale === "ru" ? "У каждой темы есть отдельная страница с материалами и подборами." : "Har bir yo'nalishning alohida sahifasi va tanlovi bor."}</p>
            </div>
          </div>
          <div className="opinion-direction-grid">
            {Object.entries(clusterMeta).map(([cluster, meta]) => (
              <Link key={cluster} className="opinion-direction-card" href={`/${locale}/cluster/${cluster}`}>
                <span>{meta.title[locale]}</span>
                <p>{meta.description[locale]}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
