import { locales, type Locale } from "./i18n";

/**
 * Data model + validation for reader engagement (likes, bookmarks).
 * Storage is localStorage for now (components/usePostEngagement.ts); keeping
 * the shapes and rules here, framework-free, means a future API can reuse
 * them and they stay unit-testable.
 */

/** Stable per-post id. ru and uz versions are separate posts with separate counters. */
export type PostKey = `${Locale}/${string}`;

export function getPostKey(locale: Locale, slug: string): PostKey {
  return `${locale}/${slug}`;
}

export function parsePostKey(key: string): { locale: Locale; slug: string } | null {
  const [locale, slug, ...rest] = key.split("/");
  if (rest.length > 0 || !slug || !locales.includes(locale as Locale)) return null;
  return { locale: locale as Locale, slug };
}

export const storageKeys = {
  bookmarks: "aisolution-bookmarks",
  like: (postKey: PostKey) => `aisolution-like:${postKey}`
};

/* ---------- likes ---------- */

export type LikeState = { liked: boolean; count: number };

export const emptyLike: LikeState = { liked: false, count: 0 };

export function parseLikeState(value: unknown): LikeState | null {
  if (typeof value !== "object" || value === null) return null;
  const { liked, count } = value as Record<string, unknown>;
  if (typeof liked !== "boolean" || typeof count !== "number" || !Number.isFinite(count)) return null;
  // `liked` is the guard: one like per reader, so the count can't be pumped.
  return { liked, count: Math.max(liked ? 1 : 0, Math.floor(count)) };
}

/** Like/unlike. Liking twice in a row is impossible — the second click un-likes. */
export function toggleLike(state: LikeState): LikeState {
  return state.liked
    ? { liked: false, count: Math.max(0, state.count - 1) }
    : { liked: true, count: state.count + 1 };
}

/* ---------- bookmarks ---------- */

export const emptyBookmarks: PostKey[] = [];

export function parseBookmarks(value: unknown): PostKey[] | null {
  if (!Array.isArray(value)) return null;
  const keys = value.filter((item): item is PostKey => typeof item === "string" && parsePostKey(item) !== null);
  return Array.from(new Set(keys));
}

/** Newest bookmark first — that's the order the Saved page shows. */
export function toggleBookmark(bookmarks: PostKey[], postKey: PostKey): PostKey[] {
  return bookmarks.includes(postKey) ? bookmarks.filter((key) => key !== postKey) : [postKey, ...bookmarks];
}

export function bookmarksForLocale(bookmarks: PostKey[], locale: Locale): string[] {
  return bookmarks.flatMap((key) => {
    const parsed = parsePostKey(key);
    return parsed && parsed.locale === locale ? [parsed.slug] : [];
  });
}
