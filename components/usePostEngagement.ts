"use client";

import { useCallback } from "react";
import {
  emptyBookmarks,
  emptyLike,
  parseBookmarks,
  parseLikeState,
  storageKeys,
  toggleBookmark,
  toggleLike,
  type PostKey
} from "@/lib/engagement";
import { useStoredValue } from "./useStoredValue";

export function usePostLike(postKey: PostKey) {
  const [like, setLike] = useStoredValue(storageKeys.like(postKey), emptyLike, parseLikeState);
  const toggle = useCallback(() => setLike(toggleLike), [setLike]);
  return { ...like, toggle };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useStoredValue(storageKeys.bookmarks, emptyBookmarks, parseBookmarks);

  const toggle = useCallback(
    (postKey: PostKey) => setBookmarks((previous) => toggleBookmark(previous, postKey)),
    [setBookmarks]
  );
  const remove = useCallback(
    (postKey: PostKey) => setBookmarks((previous) => previous.filter((key) => key !== postKey)),
    [setBookmarks]
  );

  return { bookmarks, toggle, remove };
}
