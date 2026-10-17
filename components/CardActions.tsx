"use client";

import { getPostKey } from "@/lib/engagement";
import { dictionary, type Locale } from "@/lib/i18n";
import { BookmarkIcon, HeartIcon } from "./icons";
import { useBookmarks, usePostLike } from "./usePostEngagement";

/**
 * Compact like + save icons for post cards. Same storage as the article's
 * PostActions, so liking/saving from a card and from the article stay in sync.
 */
export function CardActions({ locale, slug }: { locale: Locale; slug: string }) {
  const t = dictionary[locale];
  const postKey = getPostKey(locale, slug);
  const like = usePostLike(postKey);
  const { bookmarks, toggle } = useBookmarks();
  const saved = bookmarks.includes(postKey);

  return (
    <div className="card-actions">
      <button
        type="button"
        className={like.liked ? "is-active" : ""}
        onClick={like.toggle}
        aria-pressed={like.liked}
        aria-label={like.liked ? t.likeActiveLabel : t.likeLabel}
        title={like.liked ? t.likeActiveLabel : t.likeLabel}
      >
        <HeartIcon filled={like.liked} size={17} />
      </button>
      <button
        type="button"
        className={saved ? "is-active" : ""}
        onClick={() => toggle(postKey)}
        aria-pressed={saved}
        aria-label={saved ? t.bookmarkActiveLabel : t.bookmarkLabel}
        title={saved ? t.bookmarkActiveLabel : t.bookmarkLabel}
      >
        <BookmarkIcon filled={saved} size={17} />
      </button>
    </div>
  );
}
