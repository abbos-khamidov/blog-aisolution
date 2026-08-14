"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ContentPostCard } from "./ContentPostCard";
import { Reveal } from "./Reveal";
import type { Post } from "@/lib/post-display";
import type { Locale } from "@/lib/i18n";

const feedFilters = [
  { key: "all", labels: { ru: "Все", uz: "Barchasi" } },
  { key: "aisolution", labels: { ru: "AISOLUTION", uz: "AISOLUTION" } },
  { key: "startup", labels: { ru: "Стартапы", uz: "Startaplar" } },
  { key: "product", labels: { ru: "Продукты", uz: "Mahsulotlar" } },
  { key: "education", labels: { ru: "AI обучение", uz: "AI ta'lim" } },
  { key: "mnenie", labels: { ru: "Мнения", uz: "Fikrlar" } }
] as const;

type FeedFilterKey = (typeof feedFilters)[number]["key"];

function getFeedFilter(value: string | null): FeedFilterKey {
  return feedFilters.some((filter) => filter.key === value) ? (value as FeedFilterKey) : "all";
}

function postMatchesFilter(post: Post, filter: FeedFilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "aisolution") return post.coverLabel === "AISOLUTION";
  if (filter === "startup" || filter === "product") return post.category === filter;
  if (filter === "mnenie") return post.topicCluster === "mnenie";
  return post.coverLabel === "AI EDUCATION";
}

/**
 * Reads the ?filter= query client-side instead of via the page's searchParams
 * prop — a Server Component reading searchParams opts the whole route out of
 * static rendering. Splitting nav/grid into two leaves (instead of one node
 * dropped in place of the old server-rendered pair) preserves the original
 * DOM nesting: the pills live inside .section-head.split, the grid is a
 * sibling of it — both read the same URL independently, so they stay in
 * sync without sharing state.
 */
export function FeedFilterNav({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const filter = getFeedFilter(searchParams?.get("filter") ?? null);

  return (
    <nav className="filter-pills" aria-label="Feed filter">
      {feedFilters.map((item) => (
        <Link
          key={item.key}
          className={filter === item.key ? "is-active" : ""}
          href={item.key === "all" ? `/${locale}#feed` : `/${locale}?filter=${item.key}#feed`}
        >
          {item.labels[locale]}
        </Link>
      ))}
    </nav>
  );
}

export function FeedFilterGrid({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const searchParams = useSearchParams();
  const filter = getFeedFilter(searchParams?.get("filter") ?? null);
  const filtered = posts.filter((post) => postMatchesFilter(post, filter));

  return (
    <Reveal className="post-grid">
      {filtered.map((post, index) => (
        <ContentPostCard key={post.slug} post={post} locale={locale} badge={index === 0 ? "new" : undefined} />
      ))}
    </Reveal>
  );
}
