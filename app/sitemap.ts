import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://blog.aisolution.uz";
  const home = locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date()
  }));
  const posts = locales.flatMap((locale) =>
    getPublishedPosts().map((post) => ({
      url: `${base}/${locale}/posts/${post.slug}`,
      lastModified: new Date(post.publishedAt)
    }))
  );

  return [...home, ...posts];
}
