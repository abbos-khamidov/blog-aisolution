import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPostCard } from "@/components/ContentPostCard";
import { clusterMeta, getClustersInUse, getPostsByCluster } from "@/lib/content";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { topicClusters, type TopicCluster } from "@/lib/schema";

type Props = {
  params: Promise<{ locale: string; cluster: string }>;
};

function isTopicCluster(value: string): value is TopicCluster {
  return (topicClusters as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return locales.flatMap((locale) => getClustersInUse(locale).map((cluster) => ({ locale, cluster })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, cluster: rawCluster } = await params;
  const locale = getLocale(rawLocale);
  if (!isTopicCluster(rawCluster)) {
    return { title: dictionary[locale].missing };
  }

  const meta = clusterMeta[rawCluster];
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    if (getClustersInUse(candidate).includes(rawCluster)) {
      languages[candidate] = `/${candidate}/cluster/${rawCluster}`;
    }
  }
  if (languages.ru) {
    languages["x-default"] = languages.ru;
  }

  return {
    title: meta.title[locale],
    description: meta.description[locale],
    alternates: {
      canonical: `/${locale}/cluster/${rawCluster}`,
      languages
    }
  };
}

export default async function ClusterPage({ params }: Props) {
  const { locale: rawLocale, cluster: rawCluster } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  if (!isTopicCluster(rawCluster)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const meta = clusterMeta[rawCluster];
  const posts = getPostsByCluster(locale, rawCluster);

  return (
    <main className="article-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${locale}`}>{t.back}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{meta.title[locale]}</span>
      </nav>

      <div className="section-head">
        <h1>{meta.title[locale]}</h1>
        <p className="section-copy">{meta.description[locale]}</p>
      </div>

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <ContentPostCard key={post.slug} post={post} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="section-copy">{t.clusterEmpty}</p>
      )}
    </main>
  );
}
