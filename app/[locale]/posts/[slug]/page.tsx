import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { formatDate, getPostBySlug, getPublishedPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) => getPublishedPosts().map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocale(rawLocale);
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: dictionary[locale].missing
    };
  }

  return {
    title: post.title[locale],
    description: post.excerpt[locale],
    alternates: {
      canonical: `/${locale}/posts/${post.slug}`,
      languages: {
        ru: `/ru/posts/${post.slug}`,
        uz: `/uz/posts/${post.slug}`
      }
    },
    openGraph: {
      title: post.title[locale],
      description: post.excerpt[locale],
      images: [post.cover],
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const t = dictionary[locale];

  return (
    <>
      <SiteHeader locale={locale} compact />
      <main className="article-shell">
        <Link className="back-link" href={`/${locale}`}>
          ← {t.back}
        </Link>
        <article className="article-view">
          <img className="article-hero" src={post.cover} alt="" />
          <div className="article-content" style={{ "--accent": post.accent } as React.CSSProperties}>
            <div className="meta">
              <span style={{ color: "var(--accent)" }}>{post.category}</span>
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span>
                {post.readMinutes} {t.min}
              </span>
            </div>
            <h1>{post.title[locale]}</h1>
            <p className="lead">{post.excerpt[locale]}</p>
            {post.body[locale].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="tags">
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
