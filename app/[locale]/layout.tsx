import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../globals.css";
import { NeuralBackground } from "@/components/NeuralBackground";
import { SelectionClearButton } from "@/components/SelectionClearButton";
import { SubscribePopup } from "@/components/SubscribePopup";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";

// Cyrillic subset is required for ru content — globals.css already declared
// "Inter" as the intended font, but nothing was ever loading it, so every
// visitor silently fell back to the OS system font. This makes the existing
// declaration actually true instead of introducing a new one.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

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
    keywords: ["aisolution", "ai solution", "startup evaluation", "оценка стартапов", "ai startups"],
    icons: {
      icon: "/favicon.svg?v=6",
      shortcut: "/favicon.svg?v=6",
      apple: "/favicon.svg?v=6"
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: `https://blog.aisolution.uz/${locale}`,
      siteName: "AI Solution Blog",
      images: ["/images/aisolution-blog-hero.png"],
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ"
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: ["/images/aisolution-blog-hero.png"]
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
  const t = dictionary[locale];

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <NeuralBackground />
        {children}
        <footer className="site-footer">
          <div className="footer-brand">
            <span className="footer-mark">
              <Image src="/brand/site-mark.png" alt="" width={22} height={22} />
            </span>
            <div>
              <strong>AI Solution Blog</strong>
              <small>{t.footerTagline}</small>
            </div>
          </div>
          <Link className="footer-link" href="https://aisolution.uz">
            aisolution.uz <span aria-hidden="true">→</span>
          </Link>
        </footer>
        <SelectionClearButton locale={locale} />
        <SubscribePopup locale={locale} />
      </body>
    </html>
  );
}
