import type { MetadataRoute } from "next";
import {
  getClustersInUse,
  getOpinionPosts,
  getPostsByAuthor,
  getPostsByCluster,
  getPublishedPosts,
  getRatedPosts,
  getTranslation,
  type Post
} from "@/lib/content";
import { locales } from "@/lib/i18n";
import { listAuthors } from "@/lib/authors";

const BASE = "https://blog.aisolution.uz";

/**
 * Listing pages (home, cluster hubs, author pages, rating, opinion) don't
 * have their own publishedAt/updatedAt — their real "last modified" is
 * whichever post they list most recently touched.
 */
function latestDate(posts: Post[]): Date {
  const timestamps = posts.map((post) => new Date(post.updatedAt ?? post.publishedAt).getTime());
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date(0);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE}/${locale}`,
    lastModified: latestDate(getPublishedPosts(locale)),
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
      lastModified: latestDate(getPostsByCluster(locale, cluster)),
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
      lastModified: latestDate(getPostsByAuthor(author.key, locale)),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}/authors/${author.key}`]))
      }
    }))
  );

  const ratingPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE}/${locale}/rating`,
    lastModified: latestDate(getRatedPosts(locale)),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}/rating`]))
    }
  }));

  const opinionPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE}/${locale}/opinion`,
    lastModified: latestDate(getOpinionPosts(locale)),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}/opinion`]))
    }
  }));

  return [...home, ...posts, ...clusterHubs, ...authorPages, ...ratingPages, ...opinionPages];
}
