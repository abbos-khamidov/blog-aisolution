import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "./i18n";
import { isKnownAuthor, resolveAuthor } from "./authors";
import { resolveDataDir } from "./data-dir";
import { clusterAccent, clusterCoverImage, clusterMeta, formatDate, getVerdict, type Post } from "./post-display";
import { parseFrontmatter, topicClusters, type TopicCluster } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
/**
 * Posts written from the admin panel (/admin), in <data dir>/posts — outside
 * git and outside .next/, so neither `git pull` nor `next build` touches them
 * (see lib/data-dir.ts). A file here with the same locale + slug as a repo post
 * replaces that post (that's how the admin edits or hides a repo post).
 */
export const ADMIN_POSTS_DIR = path.join(resolveDataDir(), "posts");

export type PostSource = "repo" | "admin";
const WORDS_PER_MINUTE = 200;
const TASHKENT_TIME_ZONE = "Asia/Tashkent";

// Re-exported for existing server-side callers (pages, jsonld.ts, sitemap.ts) —
// the canonical, client-safe definitions live in ./post-display.
export { clusterAccent, clusterCoverImage, clusterMeta, formatDate, getVerdict, type Post };

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readMdxFileNames(locale: Locale, baseDir = CONTENT_DIR): string[] {
  const dir = path.join(baseDir, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

function loadPost(locale: Locale, fileName: string, baseDir = CONTENT_DIR): Post {
  const filePath = path.join(baseDir, locale, fileName);
  const relativeName = `${baseDir === CONTENT_DIR ? "content" : "data/posts"}/${locale}/${fileName}`;
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

/** Admin posts that fail validation are skipped (and logged) instead of taking the whole site down. */
function loadAdminPosts(locale: Locale): Post[] {
  return readMdxFileNames(locale, ADMIN_POSTS_DIR).flatMap((fileName) => {
    try {
      return [loadPost(locale, fileName, ADMIN_POSTS_DIR)];
    } catch (error) {
      console.error(`[admin posts] skipped data/posts/${locale}/${fileName}: ${(error as Error).message}`);
      return [];
    }
  });
}

export function getPostSources(): Map<string, PostSource> {
  const sources = new Map<string, PostSource>();
  for (const locale of locales) {
    for (const file of readMdxFileNames(locale)) sources.set(`${locale}/${file.replace(/\.mdx$/, "")}`, "repo");
    for (const file of readMdxFileNames(locale, ADMIN_POSTS_DIR)) sources.set(`${locale}/${file.replace(/\.mdx$/, "")}`, "admin");
  }
  return sources;
}

export function hasRepoPost(locale: Locale, slug: string): boolean {
  return fs.existsSync(path.join(CONTENT_DIR, locale, `${slug}.mdx`));
}

/**
 * Reading and parsing every .mdx file takes ~40 ms of blocking work, and one
 * page render asks for the posts several times (an unknown /blog/<slug> did the
 * full read on every hit). Keep the parsed list for a few seconds per process.
 * The admin panel clears it on save (lib/admin/publish.ts), and the other PM2
 * instance picks the change up within CONTENT_CACHE_MS.
 */
export const CONTENT_CACHE_MS = 10_000;
let contentCache: { at: number; posts: Post[] } | null = null;

export function clearContentCache() {
  contentCache = null;
}

function loadAllPosts(): Post[] {
  const now = Date.now();
  if (!contentCache || now - contentCache.at >= CONTENT_CACHE_MS) contentCache = { at: now, posts: readAllPosts() };
  // A fresh array each time: callers sort it in place.
  return [...contentCache.posts];
}

function readAllPosts(): Post[] {
  return locales.flatMap((locale) => {
    const fromAdmin = loadAdminPosts(locale);
    const overridden = new Set(fromAdmin.map((post) => post.slug));
    const fromRepo = readMdxFileNames(locale)
      .filter((fileName) => !overridden.has(fileName.replace(/\.mdx$/, "")))
      .map((fileName) => loadPost(locale, fileName));
    return [...fromRepo, ...fromAdmin];
  });
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
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : b.rating - a.rating));
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

/** Like getPostBySlug, but drafts included — for the admin panel only, never for public pages. */
export function getPostForAdmin(locale: Locale, slug: string): Post | undefined {
  return loadAllPosts().find((post) => post.lang === locale && post.slug === slug);
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
