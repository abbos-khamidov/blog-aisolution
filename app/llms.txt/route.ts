import { getPublishedPosts } from "@/lib/content";
import { locales } from "@/lib/i18n";

const BASE = "https://blog.aisolution.uz";

// A plain-text map of the blog for AI crawlers and answer engines (llmstxt.org).
export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    "# AI Solution Blog",
    "",
    "> Экспертный блог AISolution (Ташкент): разборы ИИ-рынка Узбекистана и Центральной Азии, стартапов, инструментов и внедрения ИИ в бизнес. Это мнение компании; каждая статья подписана автором и содержит ссылки на источники.",
    "",
    "Основной сайт: https://aisolution.uz",
    `Языки: ${locales.join(", ")}. RSS: ${BASE}/ru/feed.xml, ${BASE}/uz/feed.xml`,
    ""
  ];

  for (const locale of locales) {
    const posts = getPublishedPosts(locale);
    lines.push(`## ${locale === "ru" ? "Статьи (ru)" : "Maqolalar (uz)"}`, "");
    for (const post of posts) {
      lines.push(`- [${post.title}](${BASE}/${post.lang}/blog/${post.slug}): ${post.description}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}
