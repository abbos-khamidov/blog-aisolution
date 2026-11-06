import { getPublishedPosts } from "@/lib/content";
import { dictionary, getLocale, locales } from "@/lib/i18n";

const BASE = "https://blog.aisolution.uz";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Prerendered per language and refreshed at most every 5 minutes, not rebuilt on every hit.
export const dynamic = "force-static";
export const revalidate = 300;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = dictionary[locale];
  const posts = getPublishedPosts(locale)
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 50);

  const items = posts
    .map((post) => {
      const url = `${BASE}/${post.lang}/blog/${post.slug}`;
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${esc(post.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(t.metaTitle)}</title>
    <link>${BASE}/${locale}</link>
    <description>${esc(t.metaDescription)}</description>
    <language>${locale}</language>
    <atom:link href="${BASE}/${locale}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}
