import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { isKnownAuthor } from "../authors";
import { ADMIN_POSTS_DIR } from "../content";
import { locales, type Locale } from "../i18n";
import { frontmatterSchema, type Frontmatter } from "../schema";
import { frontmatterTextReason, isLocalPath, PATH_FIELDS, unsafeContentReason } from "./content-rules";

export const MAX_CONTENT_LENGTH = 200_000;

export type PostInput = { frontmatter: Frontmatter; content: string };
export type FieldError = { field: string; message: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isSlug(value: string): boolean {
  return SLUG.test(value) && value.length <= 120;
}

/**
 * Validates what the admin form sends with the exact rules the repo posts
 * follow (lib/schema.ts) — so a post from the panel can never break the site.
 */
export function validatePostInput(body: unknown): { ok: true; post: PostInput } | { ok: false; errors: FieldError[] } {
  if (typeof body !== "object" || body === null) return { ok: false, errors: [{ field: "(body)", message: "must be a JSON object" }] };
  const { frontmatter, content } = body as { frontmatter?: unknown; content?: unknown };

  const errors: FieldError[] = [];
  const parsed = frontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push({ field: issue.path.join(".") || "frontmatter", message: issue.message });
  }
  if (typeof content !== "string" || content.trim().length < 50) {
    errors.push({ field: "content", message: "must be at least 50 characters" });
  } else if (content.length > MAX_CONTENT_LENGTH) {
    errors.push({ field: "content", message: `must be at most ${MAX_CONTENT_LENGTH} characters` });
  }
  if (typeof content === "string") {
    const reason = unsafeContentReason(content);
    if (reason) errors.push({ field: "content", message: reason });
  }
  if (parsed.success) {
    for (const key of ["title", "description"] as const) {
      const reason = frontmatterTextReason(parsed.data[key]);
      if (reason) errors.push({ field: key, message: reason });
    }
  }
  if (parsed.success) {
    for (const key of PATH_FIELDS) {
      const value = parsed.data[key];
      if (value !== undefined && !isLocalPath(value)) {
        errors.push({ field: key, message: "must be a site path like /covers/name.png" });
      }
    }
  }
  if (parsed.success && !isKnownAuthor(parsed.data.author)) {
    errors.push({ field: "author", message: "unknown author — add them to lib/authors.ts first" });
  }
  if (errors.length || !parsed.success) return { ok: false, errors };
  return { ok: true, post: { frontmatter: parsed.data, content: (content as string).trim() } };
}

function filePath(locale: Locale, slug: string): string {
  // Both parts are validated (locale enum + kebab-case slug), so the path can't escape data/posts.
  return path.join(ADMIN_POSTS_DIR, locale, `${slug}.mdx`);
}

/** Drops undefined fields — YAML can't hold them. */
function cleanFrontmatter(frontmatter: Frontmatter): Record<string, unknown> {
  return Object.fromEntries(Object.entries(frontmatter).filter(([, value]) => value !== undefined));
}

export function toMdx(post: PostInput): string {
  return matter.stringify(`\n${post.content}\n`, cleanFrontmatter(post.frontmatter));
}

export function adminPostExists(locale: Locale, slug: string): boolean {
  return fs.existsSync(filePath(locale, slug));
}

/** Write-then-rename: a reader in the other PM2 instance never sees half a file. */
export function saveAdminPost(post: PostInput) {
  const target = filePath(post.frontmatter.lang, post.frontmatter.slug);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, toMdx(post));
  fs.renameSync(tmp, target);
}

export function deleteAdminPost(locale: Locale, slug: string): boolean {
  const target = filePath(locale, slug);
  if (!fs.existsSync(target)) return false;
  fs.unlinkSync(target);
  return true;
}
