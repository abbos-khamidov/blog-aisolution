"use client";

import Link from "next/link";
import { bookmarksForLocale, getPostKey } from "@/lib/engagement";
import { dictionary, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/post-display";
import { ContentPostCard } from "./ContentPostCard";
import { useBookmarks } from "./usePostEngagement";
import { useHydrated } from "./useStoredValue";

type Props = {
  locale: Locale;
  posts: Post[];
};

/**
 * `posts` = every published post in this locale (rendered on the server);
 * the bookmark list lives in localStorage, so the filtering happens here.
 * Bookmarks pointing at a post that was since removed are simply skipped.
 */
export function SavedPosts({ locale, posts }: Props) {
  const t = dictionary[locale];
  const hydrated = useHydrated();
  const { bookmarks, remove } = useBookmarks();

  if (!hydrated) {
    return <p className="section-copy saved-status">{t.savedLoading}</p>;
  }

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const saved = bookmarksForLocale(bookmarks, locale).flatMap((slug) => {
    const post = postsBySlug.get(slug);
    return post ? [post] : [];
  });

  if (saved.length === 0) {
    return (
      <div className="saved-empty">
        <p className="section-copy">{t.savedEmpty}</p>
        <div className="hero-actions">
          <Link className="button primary" href={`/${locale}#feed`}>
            {t.navFeed}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-grid saved-grid">
      {saved.map((post) => (
        <div key={post.slug} className="saved-item">
          <ContentPostCard post={post} locale={locale} />
          <button className="saved-remove" type="button" onClick={() => remove(getPostKey(locale, post.slug))}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            {t.savedRemove}
          </button>
        </div>
      ))}
    </div>
  );
}
