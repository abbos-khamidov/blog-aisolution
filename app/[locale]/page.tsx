import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogHome } from "@/components/BlogHome";
import { getLocale, locales, type Locale } from "@/lib/i18n";
import { buildWebsiteGraph } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ru: "/ru",
        uz: "/uz",
        "x-default": "/ru"
      },
      types: { "application/rss+xml": `/${locale}/feed.xml` }
    }
  };
}

export default async function LocaleHomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const graph = buildWebsiteGraph();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <BlogHome locale={getLocale(rawLocale)} />
    </>
  );
}
