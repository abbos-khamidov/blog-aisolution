import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClustersSection } from "@/components/ClustersSection";
import { SiteHeader } from "@/components/SiteHeader";
import { dictionary, getLocale, locales, samePathInEveryLocale, type Locale } from "@/lib/i18n";
import { buildWebsiteGraph, jsonLdScript } from "@/lib/jsonld";

type Props = {
  params: Promise<{ locale: string }>;
};

// The server runs several PM2 instances; revalidatePath() from the admin panel only
// refreshes the one that handled the save, so the others catch up within a minute.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = dictionary[locale];

  return {
    title: t.navClusters,
    description: t.clustersCopy,
    alternates: {
      canonical: `/${locale}/topics`,
      languages: {
        ru: "/ru/topics",
        uz: "/uz/topics",
        "x-default": "/ru/topics"
      }
    }
  };
}

/** Header item «Темы» opens this page instead of a #anchor on the homepage. */
export default async function TopicsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const graph = buildWebsiteGraph();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />
      <SiteHeader locale={locale} alternates={samePathInEveryLocale("/topics")} />
      <main className="home nav-page">
        <ClustersSection locale={locale} headingAs="h1" heading={t.navClusters} />
      </main>
    </>
  );
}
