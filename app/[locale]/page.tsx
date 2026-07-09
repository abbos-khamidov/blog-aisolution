import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogHome } from "@/components/BlogHome";
import { getLocale, locales, type Locale } from "@/lib/i18n";
import { buildWebsiteGraph } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ filter?: string }>;
};

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
        uz: "/uz"
      }
    }
  };
}

export default async function LocaleHomePage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const query = await searchParams;

  const graph = buildWebsiteGraph();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <BlogHome locale={getLocale(rawLocale)} activeFilter={query?.filter} />
    </>
  );
}
