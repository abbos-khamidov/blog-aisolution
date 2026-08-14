import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "./i18n";
import { isKnownAuthor, resolveAuthor } from "./authors";
import { clusterAccent, clusterCoverImage, clusterMeta, formatDate, getVerdict, type Post } from "./post-display";
import { parseFrontmatter, topicClusters, type TopicCluster } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
const WORDS_PER_MINUTE = 200;
const TASHKENT_TIME_ZONE = "Asia/Tashkent";

// Re-exported for existing server-side callers (pages, jsonld.ts, sitemap.ts) —
// the canonical, client-safe definitions live in ./post-display.
export { clusterAccent, clusterCoverImage, clusterMeta, formatDate, getVerdict, type Post };

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readMdxFileNames(locale: Locale): string[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

function loadPost(locale: Locale, fileName: string): Post {
  const filePath = path.join(CONTENT_DIR, locale, fileName);
  const relativeName = `content/${locale}/${fileName}`;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const frontmatter = parseFrontmatter(relativeName, data);

  if (frontmatter.lang !== locale) {
    throw new Error(`${relativeName}: frontmatter.lang ("${frontmatter.lang}") doesn't match its folder ("${locale}")`);
  }

  const expectedSlug = fileName.replace(/\.mdx$/, "");
  if (frontmatter.slug !== expectedSlug) {
    throw new Error(`${relativeName}: frontmatter.slug ("${frontmatter.slug}") doesn't match the file name ("${expectedSlug}.mdx")`);
  }

  if (!isKnownAuthor(frontmatter.author)) {
    // Throws UnknownAuthorError with the file name context lost otherwise —
    // re-wrap so a bad byline still points back at the offending file.
    try {
      resolveAuthor(frontmatter.author);
    } catch (error) {
      throw new Error(`${relativeName}: ${(error as Error).message}`);
    }
  }

  return {
    ...frontmatter,
    content: content.trim(),
    readMinutes: estimateReadMinutes(content)
  };
}

function loadAllPosts(): Post[] {
  return locales.flatMap((locale) => readMdxFileNames(locale).map((fileName) => loadPost(locale, fileName)));
}

export function getAllPosts(): Post[] {
  return loadAllPosts();
}

export function getPublishedPosts(locale?: Locale): Post[] {
  return loadAllPosts()
    .filter((post) => !post.draft)
    .filter((post) => (locale ? post.lang === locale : true))
    .sort((a, b) => {
      if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
      return b.rating - a.rating;
    });
}

export function getRatedPosts(locale: Locale): Post[] {
  return getPublishedPosts(locale)
    .filter((post) => post.topicCluster !== "mnenie")
    .sort((a, b) => b.rating - a.rating || (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getOpinionPosts(locale: Locale): Post[] {
  return getPublishedPosts(locale)
    .filter((post) => post.topicCluster === "mnenie")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

function getTashkentDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
}

export function getStartupStats(
  locale: Locale,
  now = new Date()
): { today: number; year: number; total: number; yearNumber: number } {
  const posts = getPublishedPosts(locale).filter((post) => post.category === "startup");
  const todayKey = getTashkentDateKey(now);
  const yearKey = todayKey.slice(0, 4);

  return {
    today: posts.filter((post) => post.publishedAt === todayKey).length,
    year: posts.filter((post) => post.publishedAt.startsWith(yearKey)).length,
    total: posts.length,
    yearNumber: Number(yearKey)
  };
}

export function getStartupSurvivalStats(
  locale: Locale,
  now = new Date()
): { today: number; year: number; total: number; yearNumber: number } {
  const posts = getPublishedPosts(locale).filter(
    (post) => post.category === "startup" && getVerdict(post.rating) === "up"
  );
  const todayKey = getTashkentDateKey(now);
  const yearKey = todayKey.slice(0, 4);

  return {
    today: posts.filter((post) => post.publishedAt === todayKey).length,
    year: posts.filter((post) => post.publishedAt.startsWith(yearKey)).length,
    total: posts.length,
    yearNumber: Number(yearKey)
  };
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return getPublishedPosts(locale).find((post) => post.slug === slug);
}

export function getPostsByCluster(
  locale: Locale,
  cluster: TopicCluster,
  options: { excludeSlug?: string; limit?: number } = {}
): Post[] {
  const posts = getPublishedPosts(locale).filter(
    (post) => post.topicCluster === cluster && post.slug !== options.excludeSlug
  );
  return typeof options.limit === "number" ? posts.slice(0, options.limit) : posts;
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return getPostsByCluster(post.lang, post.topicCluster, { excludeSlug: post.slug, limit });
}

export function getTranslation(post: Post): Post | undefined {
  if (!post.translationOf) return undefined;
  const otherLocale = locales.find((locale) => locale !== post.lang);
  if (!otherLocale) return undefined;
  return getPublishedPosts(otherLocale).find(
    (candidate) => candidate.slug === post.translationOf || candidate.translationOf === post.slug
  );
}

export function getPostsByAuthor(authorKey: string, locale?: Locale): Post[] {
  return getPublishedPosts(locale).filter((post) => post.author === authorKey);
}

export function getClustersInUse(locale?: Locale): TopicCluster[] {
  const used = new Set(getPublishedPosts(locale).map((post) => post.topicCluster));
  return topicClusters.filter((cluster) => used.has(cluster));
}
