import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Onest } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../globals.css";
import { SelectionClearButton } from "@/components/SelectionClearButton";
import { SubscribePopup } from "@/components/SubscribePopup";
import { dictionary, getLocale, locales, type Locale } from "@/lib/i18n";
import { themeInitScript } from "@/lib/theme";

// Onest: a modern grotesque with full Cyrillic + Latin, so ru and uz pages
// share one typeface. JetBrains Mono carries labels, dates and scores.
const sans = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap"
});
const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
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
      images: ["/og-image.png?v=2"],
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ"
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: ["/og-image.png?v=2"]
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
    // suppressHydrationWarning: themeInitScript sets data-theme on <html>
    // before React hydrates, so that one attribute legitimately differs.
    <html lang={locale} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <footer className="site-footer">
          <div className="footer-brand">
            <span className="footer-mark">
              <img className="brand-logo-dark" src="/brand/mark-on-dark.png" alt="" width={28} height={28} />
              <img className="brand-logo-light" src="/brand/mark-on-light.png" alt="" width={28} height={28} />
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
