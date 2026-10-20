"use client";

import { dictionary, type Locale } from "@/lib/i18n";
import { getPostKey } from "@/lib/engagement";
import { BookmarkIcon, HeartIcon } from "./icons";
import { useBookmarks, usePostLike } from "./usePostEngagement";

type Props = {
  locale: Locale;
  slug: string;
};

/** Like + Save for one article. Each post has its own counter/state, keyed by locale/slug. */
export function PostActions({ locale, slug }: Props) {
  const t = dictionary[locale];
  const postKey = getPostKey(locale, slug);
  const like = usePostLike(postKey);
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const saved = bookmarks.includes(postKey);

  return (
    <div className="post-actions">
      <button
        className={`post-action${like.liked ? " is-active" : ""}`}
        type="button"
        onClick={like.toggle}
        aria-pressed={like.liked}
        aria-label={like.liked ? t.likeActiveLabel : t.likeLabel}
        title={like.liked ? t.likeActiveLabel : t.likeLabel}
      >
        <HeartIcon filled={like.liked} />
        <span>{t.likeLabel}</span>
        <strong className="post-action-count" aria-live="polite">
          {like.count}
        </strong>
      </button>

      <button
        className={`post-action${saved ? " is-active" : ""}`}
        type="button"
        onClick={() => toggleBookmark(postKey)}
        aria-pressed={saved}
      >
        <BookmarkIcon filled={saved} />
        <span>{saved ? t.bookmarkActiveLabel : t.bookmarkLabel}</span>
      </button>
    </div>
  );
}
