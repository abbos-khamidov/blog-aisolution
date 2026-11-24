import Link from "next/link";
import { ScoreRing } from "./ScoreRing";
import { MotionHeading } from "./live/MotionHeading";
import { ScoreRain } from "./live/SectionScenes";
import { VerdictBoard, type VerdictRow } from "./live/VerdictBoard";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import { clusterMeta, formatDate, getPublishedPosts, getRatedPosts, getVerdict, type Post } from "@/lib/content";

type Dictionary = (typeof dictionary)[Locale];

/** "годно" / "средне" / "слабо" for a score. */
export function verdictText(rating: number, t: Dictionary): string {
  const verdict = getVerdict(rating);
  return verdict === "up" ? t.ratingVerdictUp : verdict === "average" ? t.ratingVerdictAverage : t.ratingVerdictDown;
}

/** Opinion pieces carry no score, so they get their own verdict bucket. */
export function verdictKind(post: Post): VerdictRow["verdict"] {
  if (post.topicCluster === "mnenie") return "opinion";
  return getVerdict(post.rating);
}

/** "Тема · 23 окт. 2026 г." — non-breaking spaces so a narrow phone never splits the date. */
export function postMeta(post: Post, locale: Locale): string {
  return `${clusterMeta[post.topicCluster].title[locale]} · ${formatDate(post.publishedAt, locale).replace(/ /g, " ")}`;
}

/** Same rules as the old feed pills (components/FeedFilter.tsx), precomputed per post. */
function feedTags(post: Post): string[] {
  const tags: string[] = [];
  if (post.coverLabel === "AISOLUTION") tags.push("aisolution");
  if (post.category === "startup" || post.category === "product") tags.push(post.category);
  if (post.coverLabel === "AI EDUCATION") tags.push("education");
  if (post.topicCluster === "mnenie") tags.push("mnenie");
  return tags;
}

/**
 * "Материалы": the featured review plus the searchable, filterable list of all
 * posts. Shown on the homepage and, with an <h1>, as the /[locale]/materials page.
 */
export function FeedSection({ locale, headingAs = "h2", heading }: { locale: Locale; headingAs?: "h1" | "h2"; heading?: string }) {
  const t = dictionary[locale];
  const posts = getPublishedPosts(locale);
  const rated = getRatedPosts(locale);
  const featured = rated[0];

  const rows: VerdictRow[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    meta: postMeta(post, locale),
    minutes: `${post.readMinutes} ${t.min}`,
    rating: post.topicCluster === "mnenie" ? null : post.rating,
    verdict: verdictKind(post),
    verdictLabel: post.topicCluster === "mnenie" ? t.opinionChip : verdictText(post.rating, t),
    tags: feedTags(post)
  }));

  const filterLabels = [
    { key: "all", label: locale === "ru" ? "Все" : "Barchasi" },
    { key: "startup", label: locale === "ru" ? "Стартапы" : "Startaplar" },
    { key: "product", label: locale === "ru" ? "Продукты" : "Mahsulotlar" },
    { key: "aisolution", label: "AISOLUTION" },
    { key: "education", label: locale === "ru" ? "AI обучение" : "AI ta'lim" },
    { key: "mnenie", label: t.navOpinion }
  ].filter((f) => f.key === "all" || rows.some((row) => row.tags.includes(f.key)));

  return (
    <section className="lv-section lv-verdicts" id="feed" aria-labelledby="verdicts-title">
      <div className="lv-bg lv-bg-rain">
        <ScoreRain ratings={rated.map((post) => post.rating)} />
      </div>
      <div className="lv-head">
        <MotionHeading as={headingAs} id="verdicts-title" text={heading ?? t.verdictsTitle} immediate={headingAs === "h1"} />
        <p className="lv-lead">{t.verdictsCopy}</p>
      </div>
      {featured && (
        <article className="lv-featured">
          <ScoreRing rating={featured.rating} label={verdictText(featured.rating, t)} size="lg" />
          <div>
            <p className="lv-label">{t.featuredKicker}</p>
            <h3>
              <Link href={`/${locale}/blog/${featured.slug}`}>{featured.title}</Link>
            </h3>
            <p className="lv-featured-copy">{featured.description}</p>
            <div className="lv-featured-meta">
              <Link className="button primary" href={`/${locale}/blog/${featured.slug}`}>
                {t.readReview}
              </Link>
              <span>
                {postMeta(featured, locale)} · {featured.readMinutes} {t.min}
              </span>
            </div>
          </div>
        </article>
      )}
      <VerdictBoard
        rows={rows}
        locale={locale}
        readLabel={t.readReview}
        labels={{
          filters: filterLabels,
          saved: t.navSaved,
          search: t.searchLabel,
          searchPlaceholder: t.searchPlaceholder,
          empty: t.searchEmpty,
          emptySaved: t.savedEmpty,
          opinionGroup: t.opinionGroup,
          shownOf: t.shownOf
        }}
      />
    </section>
  );
}
