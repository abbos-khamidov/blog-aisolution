"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { bookmarksForLocale } from "@/lib/engagement";
import type { Locale } from "@/lib/i18n";
import { CardActions } from "../CardActions";
import { useBookmarks } from "../usePostEngagement";
import { useHydrated } from "../useStoredValue";
import { prefersReducedMotion } from "./useCanvasScene";

export type VerdictRow = {
  slug: string;
  title: string;
  description: string;
  meta: string;
  minutes: string;
  rating: number | null;
  verdict: "up" | "average" | "down" | "opinion";
  verdictLabel: string;
  /** Feed filter keys this post matches (same rules as the old feed pills). */
  tags: string[];
};

type Labels = {
  filters: { key: string; label: string }[];
  saved: string;
  search: string;
  searchPlaceholder: string;
  empty: string;
  emptySaved: string;
  opinionGroup: string;
  shownOf: string;
};

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!run || prefersReducedMotion()) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 1100);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return <>{shown.toFixed(1)}</>;
}

function Row({ row, rank, locale, readLabel }: { row: VerdictRow; rank: number; locale: Locale; readLabel: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const [state, setState] = useState<"rest" | "wait" | "in">("rest");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("wait");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("in");
        observer.disconnect();
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const href = `/${locale}/blog/${row.slug}`;
  const opinion = row.rating === null;
  return (
    <li
      ref={ref}
      className={`lb-row v-${row.verdict}${opinion ? " lb-op" : ""}${state !== "rest" ? " is-wait" : ""}${state === "in" ? " is-in" : ""}`}
      style={{ "--k": Math.min(rank % 6, 5) } as CSSProperties}
    >
      {!opinion && <span className="lb-rank">{String(rank + 1).padStart(2, "0")}</span>}
      <div className="lb-main">
        <div className="lb-meta">
          {row.meta} · {row.minutes}
        </div>
        <h3>
          <Link href={href} className="lb-link">
            {row.title}
          </Link>
        </h3>
        {!opinion && row.rating !== null && (
          <div className="lb-bar" aria-hidden="true">
            <i style={{ "--w": `${row.rating * 10}%` } as CSSProperties} />
            <span className="lb-mark" />
          </div>
        )}
      </div>
      {!opinion && row.rating !== null && (
        <div className="lb-score" aria-label={`${row.rating.toFixed(1)} / 10 — ${row.verdictLabel}`}>
          <b>
            <CountUp value={row.rating} run={state === "in"} />
          </b>
          <span>{row.verdictLabel}</span>
        </div>
      )}
      <div className="lb-side">
        <CardActions locale={locale} slug={row.slug} />
        <span className="sr-only">{readLabel}</span>
      </div>
    </li>
  );
}

/** Ranked list of every razbor: filter pills, search, like/save; opinion columns grouped below. */
export function VerdictBoard({ rows, locale, labels, readLabel }: { rows: VerdictRow[]; locale: Locale; labels: Labels; readLabel: string }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const hydrated = useHydrated();
  const { bookmarks } = useBookmarks();
  const savedSlugs = useMemo(() => new Set(bookmarksForLocale(bookmarks, locale)), [bookmarks, locale]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("filter");
    if (fromUrl && labels.filters.some((f) => f.key === fromUrl)) setFilter(fromUrl);
  }, [labels.filters]);

  const needle = query.trim().toLowerCase();
  const visible = rows.filter(
    (row) =>
      (filter === "all" || (filter === "saved" ? savedSlugs.has(row.slug) : row.tags.includes(filter))) &&
      (!needle || `${row.title} ${row.description} ${row.meta}`.toLowerCase().includes(needle))
  );
  const rated = visible.filter((row) => row.rating !== null);
  const opinions = visible.filter((row) => row.rating === null);
  const pills = [...labels.filters, { key: "saved", label: labels.saved }];

  return (
    <div className="verdict-board">
      <div className="vb-controls">
        <div className="vb-pills" role="group" aria-label="Filter">
          {pills.map((pill) => (
            <button key={pill.key} type="button" className="chip" aria-pressed={filter === pill.key} onClick={() => setFilter(pill.key)}>
              {pill.label}
              {pill.key === "saved" && hydrated && savedSlugs.size > 0 && <span className="chip-count">{savedSlugs.size}</span>}
            </button>
          ))}
        </div>
        <label className="vb-search">
          <span>{labels.search}</span>
          <input id="verdict-search" type="search" value={query} placeholder={labels.searchPlaceholder} autoComplete="off" onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="vb-empty">{filter === "saved" ? labels.emptySaved : labels.empty}</p>
      ) : (
        <>
          {rated.length > 0 && (
            <ol className="lb">
              {rated.map((row, i) => (
                <Row key={row.slug} row={row} rank={i} locale={locale} readLabel={readLabel} />
              ))}
            </ol>
          )}
          {opinions.length > 0 && (
            <>
              <p className="lb-op-head">{labels.opinionGroup}</p>
              <ul className="lb-ops">
                {opinions.map((row, i) => (
                  <Row key={row.slug} row={row} rank={i} locale={locale} readLabel={readLabel} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <p className="vb-count">
        {visible.length} / {rows.length} {labels.shownOf}
      </p>
    </div>
  );
}
