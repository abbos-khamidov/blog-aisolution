import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPostCard } from "@/components/ContentPostCard";
import { SiteHeader } from "@/components/SiteHeader";
import { isKnownAuthor, listAuthors, resolveAuthor } from "@/lib/authors";
import { getPostsByAuthor } from "@/lib/content";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { buildAuthorGraph } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string; author: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) => listAuthors().map((author) => ({ locale, author: author.key })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, author: authorKey } = await params;
  const locale = getLocale(rawLocale);
  if (!isKnownAuthor(authorKey)) {
    return { title: dictionary[locale].missing };
  }

  const author = resolveAuthor(authorKey);
  return {
    title: author.name[locale],
    description: author.bio[locale],
    alternates: {
      canonical: `/${locale}/authors/${author.key}`,
      languages: {
        ru: `/ru/authors/${author.key}`,
        uz: `/uz/authors/${author.key}`,
        "x-default": `/ru/authors/${author.key}`
      }
    }
  };
}

export default async function AuthorPage({ params }: Props) {
  const { locale: rawLocale, author: authorKey } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  if (!isKnownAuthor(authorKey)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const author = resolveAuthor(authorKey);
  const posts = getPostsByAuthor(author.key, locale);
  const graph = buildAuthorGraph(author.key);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <SiteHeader locale={locale} compact />
      <main className="article-shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.back}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{author.name[locale]}</span>
        </nav>

        <div className="section-head">
          <img className="author-photo" src={author.image} alt={author.name[locale]} width={84} height={84} />
          <h1>{author.name[locale]}</h1>
          <p className="section-copy">{author.role[locale]}</p>
          <p className="section-copy">{author.bio[locale]}</p>
          {author.sameAs.length > 0 && (
            <div className="tags">
              {author.sameAs.map((link) => (
                <a key={link} href={link} target="_blank" rel="me noopener noreferrer">
                  {new URL(link).hostname.replace(/^www\./, "")}
                </a>
              ))}
            </div>
          )}
        </div>

        {posts.length > 0 && (
          <>
            <h2>{t.authorPosts}</h2>
            <div className="post-grid">
              {posts.map((post) => (
                <ContentPostCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
