import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedPosts } from "@/components/SavedPosts";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishedPosts } from "@/lib/content";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";

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
    title: t.savedTitle,
    description: t.savedCopy,
    // Per-browser list, empty for every crawler — nothing to index.
    robots: { index: false, follow: true }
  };
}

export default async function SavedPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  // Cards only need frontmatter — don't ship every article body to the client.
  const posts = getPublishedPosts(locale).map((post) => ({ ...post, content: "" }));

  return (
    <>
      <SiteHeader locale={locale} compact />
      <main className="article-shell saved-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.back}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{t.navSaved}</span>
        </nav>

        <div className="section-head">
          <h1>{t.savedTitle}</h1>
          <p className="section-copy">{t.savedCopy}</p>
        </div>

        <SavedPosts locale={locale} posts={posts} />
      </main>
    </>
  );
}
