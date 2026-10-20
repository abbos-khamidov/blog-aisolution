"use client";

import Link from "next/link";
import { bookmarksForLocale } from "@/lib/engagement";
import { dictionary, type Locale } from "@/lib/i18n";
import { useBookmarks } from "./usePostEngagement";
import { useHydrated } from "./useStoredValue";

/** Header entry to the Saved page; the counter updates live as posts are saved. */
export function SavedLink({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const hydrated = useHydrated();
  const { bookmarks } = useBookmarks();
  const count = bookmarksForLocale(bookmarks, locale).length;

  return (
    <Link className="saved-link" href={`/${locale}/saved`} aria-label={t.navSaved} title={t.navSaved}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4h12v16l-6-4-6 4V4Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <strong>{t.navSaved}</strong>
      {hydrated && count > 0 && <span className="saved-link-count">{count}</span>}
    </Link>
  );
}
