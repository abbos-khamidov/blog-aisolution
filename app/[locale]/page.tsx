import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogHome } from "@/components/BlogHome";
import { getLocale, locales, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
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

export default async function LocaleHomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();

  return <BlogHome locale={getLocale(rawLocale)} />;
}
