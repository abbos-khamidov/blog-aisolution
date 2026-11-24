import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedSection } from "@/components/FeedSection";
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
    title: t.navFeed,
    description: t.verdictsCopy,
    alternates: {
      canonical: `/${locale}/materials`,
      languages: {
        ru: "/ru/materials",
        uz: "/uz/materials",
        "x-default": "/ru/materials"
      }
    }
  };
}

/** Header item «Материалы» opens this page instead of a #anchor on the homepage. */
export default async function MaterialsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const graph = buildWebsiteGraph();

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />
      <SiteHeader locale={locale} alternates={samePathInEveryLocale("/materials")} />
      <main className="home nav-page">
        <FeedSection locale={locale} headingAs="h1" heading={t.navFeed} />
      </main>
    </>
  );
}
