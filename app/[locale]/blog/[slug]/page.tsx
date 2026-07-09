import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { ContentPostCard } from "@/components/ContentPostCard";
import { PostCover } from "@/components/PostCover";
import { ServiceCta } from "@/components/service-cta";
import { SiteHeader } from "@/components/SiteHeader";
import { resolveAuthor } from "@/lib/authors";
import { clusterMeta, formatDate, getPostBySlug, getPublishedPosts, getRelatedPosts, getTranslation } from "@/lib/content";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { authorUrl, buildArticleGraph } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) => getPublishedPosts(locale).map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocale(rawLocale);
  const post = getPostBySlug(locale, slug);

  if (!post) {
    return { title: dictionary[locale].missing };
  }

  const translation = getTranslation(post);
  const languages: Record<string, string> = {
    [post.lang]: `/${post.lang}/blog/${post.slug}`
  };
  if (translation) {
    languages[translation.lang] = `/${translation.lang}/blog/${translation.slug}`;
  }
  // x-default always points at the ru version when one exists — no ru
  // translation means there's nothing sane to default to, so we omit it
  // rather than link a locale that doesn't have this post.
  if (languages.ru) {
    languages["x-default"] = languages.ru;
  }

  const author = resolveAuthor(post.author);

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/${post.lang}/blog/${post.slug}`,
      languages
    },
    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.cover],
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.keywords,
      authors: [authorUrl(post.lang, author.key)]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.cover]
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const t = dictionary[locale];
  const author = resolveAuthor(post.author);
  const cluster = clusterMeta[post.topicCluster];
  const related = getRelatedPosts(post, 3);
  const graph = buildArticleGraph(post);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <SiteHeader locale={locale} compact />
      <main className="article-shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.back}</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/${locale}/cluster/${post.topicCluster}`}>{cluster.title[locale]}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{post.title}</span>
        </nav>

        <article className="article-view">
          <PostCover
            cluster={post.topicCluster}
            locale={locale}
            cover={post.cover}
            label={post.coverLabel}
            logo={post.coverLogo}
            size="hero"
          />
          <div className="article-content">
            <div className="meta">
              <Link href={`/${locale}/cluster/${post.topicCluster}`}>{cluster.title[locale]}</Link>
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span>
                {post.readMinutes} {t.min}
              </span>
            </div>
            <h1>{post.title}</h1>
            <p className="lead">{post.description}</p>

            <div className="mdx-body">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }] as never]
                  }
                }}
              />
            </div>

            <p className="byline">
              <Link href={`/${locale}/authors/${author.key}`}>{author.name[locale]}</Link>
              {" — "}
              {author.role[locale]}
            </p>

            <div className="tags">
              {post.keywords.map((keyword) => (
                <span key={keyword}>#{keyword}</span>
              ))}
            </div>

            <div className="article-rating" aria-label={`${t.ratingLabel}: ${post.rating} / 10`}>
              <span>{t.ratingLabel}</span>
              <strong>{post.rating.toFixed(1)}/10</strong>
            </div>
          </div>
        </article>

        {post.serviceLink && <ServiceCta locale={locale} serviceLink={post.serviceLink} />}

        {related.length > 0 && (
          <section className="related-posts">
            <h2>{t.relatedTitle}</h2>
            <div className="post-grid">
              {related.map((relatedPost) => (
                <ContentPostCard key={relatedPost.slug} post={relatedPost} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
