import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import "../globals.css";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";

type Props = {
  children: ReactNode;
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
    metadataBase: new URL("https://blog.aisolution.uz"),
    title: {
      default: t.metaTitle,
      template: "%s — AI Solution Blog"
    },
    description: t.metaDescription,
    keywords: ["aisolution", "ai solution", "aisolutions", "blog aisolution", "ai crm uzbekistan"],
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: `https://blog.aisolution.uz/${locale}`,
      siteName: "AI Solution Blog",
      images: ["/images/aisolution-blog-hero.png"],
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/**
 * This is the app's ROOT layout (it owns <html>/<body>) even though it
 * lives under [locale] — the bare "/" route is handled by middleware.ts
 * (308 to /ru) rather than by an app/page.tsx, so nothing needs a root
 * layout outside this dynamic segment. That's what lets <html lang> vary
 * per locale instead of being hardcoded — see claude.md, задача 4.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = getLocale(rawLocale);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
