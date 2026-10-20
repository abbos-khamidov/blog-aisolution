import { describe, expect, it } from "vitest";
import {
  bookmarksForLocale,
  getPostKey,
  parseBookmarks,
  parseLikeState,
  parsePostKey,
  toggleBookmark,
  toggleLike
} from "./engagement";

describe("post keys", () => {
  it("round-trips locale/slug and keeps ru and uz separate", () => {
    expect(getPostKey("ru", "unitlab-ai-review")).toBe("ru/unitlab-ai-review");
    expect(parsePostKey("uz/unitlab-ai-sharhi")).toEqual({ locale: "uz", slug: "unitlab-ai-sharhi" });
    expect(getPostKey("ru", "a")).not.toBe(getPostKey("uz", "a"));
  });

  it("rejects unknown locales and malformed keys", () => {
    expect(parsePostKey("en/post")).toBeNull();
    expect(parsePostKey("ru/")).toBeNull();
    expect(parsePostKey("ru/a/b")).toBeNull();
  });
});

describe("likes", () => {
  it("toggles instead of incrementing, so one reader can't pump the count", () => {
    const once = toggleLike({ liked: false, count: 0 });
    expect(once).toEqual({ liked: true, count: 1 });
    expect(toggleLike(once)).toEqual({ liked: false, count: 0 });
  });

  it("never goes below zero", () => {
    expect(toggleLike({ liked: true, count: 0 })).toEqual({ liked: false, count: 0 });
  });

  it("falls back on corrupted or hand-edited storage", () => {
    expect(parseLikeState(null)).toBeNull();
    expect(parseLikeState({ liked: "yes", count: 1 })).toBeNull();
    expect(parseLikeState({ liked: true, count: Number.POSITIVE_INFINITY })).toBeNull();
    expect(parseLikeState({ liked: true, count: 0 })).toEqual({ liked: true, count: 1 });
  });
});

describe("bookmarks", () => {
  it("adds newest first and removes on second toggle", () => {
    const a = getPostKey("ru", "a");
    const b = getPostKey("ru", "b");
    const saved = toggleBookmark(toggleBookmark([], a), b);
    expect(saved).toEqual([b, a]);
    expect(toggleBookmark(saved, a)).toEqual([b]);
  });

  it("filters by locale and drops junk/duplicates from storage", () => {
    const parsed = parseBookmarks(["ru/a", "uz/b", "ru/a", 42, "xx/c"]) ?? [];
    expect(parsed).toEqual(["ru/a", "uz/b"]);
    expect(bookmarksForLocale(parsed, "ru")).toEqual(["a"]);
    expect(bookmarksForLocale(parsed, "uz")).toEqual(["b"]);
    expect(parseBookmarks({})).toBeNull();
  });
});

