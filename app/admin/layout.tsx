import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Onest } from "next/font/google";
import "../globals.css";
import "./admin.css";

const sans = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — AI Solution Blog",
  robots: { index: false, follow: false, nocache: true }
};

/** Separate root layout: the admin never shares the public header, footer or popups. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={`${sans.variable} ${mono.variable}`}>
      <body className="admin-body">{children}</body>
    </html>
  );
}
