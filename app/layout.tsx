import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.aisolution.uz"),
  title: {
    default: "AISOLUTION Blog - AI, CRM, рынок и честная точка зрения",
    template: "%s - AISOLUTION Blog"
  },
  description: "Блог AISOLUTION: новости AI и CRM, разбор конкурентов, новые лица рынка и практичная экспертиза для бизнеса в Узбекистане.",
  keywords: ["aisolution", "aisolutions", "ai solution", "blog aisolution", "ai crm uzbekistan", "ai solution uzbekistan"],
  openGraph: {
    title: "AISOLUTION Blog",
    description: "AI, CRM, рынок и честная точка зрения без корпоративной ваты.",
    url: "https://blog.aisolution.uz",
    siteName: "AISOLUTION Blog",
    images: ["/images/aisolution-blog-hero.png"],
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
