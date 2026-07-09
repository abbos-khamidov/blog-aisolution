import type { MetadataRoute } from "next";
import { getClustersInUse, getPublishedPosts, getTranslation } from "@/lib/content";
import { locales } from "@/lib/i18n";
import { listAuthors } from "@/lib/authors";

const BASE = "https://blog.aisolution.uz";

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}`]))
    }
  }));

  const posts: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getPublishedPosts(locale).map((post) => {
      const translation = getTranslation(post);
      const languages: Record<string, string> = {
        [post.lang]: `${BASE}/${post.lang}/blog/${post.slug}`
      };
      if (translation) {
        languages[translation.lang] = `${BASE}/${translation.lang}/blog/${translation.slug}`;
      }
      return {
        url: `${BASE}/${post.lang}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt ?? post.publishedAt),
        alternates: { languages }
      };
    })
  );

  const clusterHubs: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getClustersInUse(locale).map((cluster) => ({
      url: `${BASE}/${locale}/cluster/${cluster}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.filter((l) => getClustersInUse(l).includes(cluster)).map((l) => [l, `${BASE}/${l}/cluster/${cluster}`])
        )
      }
    }))
  );

  const authorPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    listAuthors().map((author) => ({
      url: `${BASE}/${locale}/authors/${author.key}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}/authors/${author.key}`]))
      }
    }))
  );

  const ratingPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE}/${locale}/rating`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}/rating`]))
    }
  }));

  return [...home, ...posts, ...clusterHubs, ...authorPages, ...ratingPages];
}
