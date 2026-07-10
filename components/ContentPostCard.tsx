import Link from "next/link";
import { PostCover } from "./PostCover";
import { resolveAuthor } from "@/lib/authors";
import { clusterMeta, formatDate, getVerdict, type Post } from "@/lib/content";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  post: Post;
  locale: Locale;
  badge?: "new";
};

/**
 * Card for posts sourced from lib/content.ts (the MDX/zod pipeline).
 * Deliberately separate from components/PostCard.tsx, which renders the
 * older lib/posts.ts shape — the two Post types aren't compatible, and this
 * one stays independent so it doesn't collide with in-progress design work
 * on that file.
 */
export function ContentPostCard({ post, locale, badge }: Props) {
  const t = dictionary[locale];
  const author = resolveAuthor(post.author);
  const isAisolutionCard = post.coverLabel === "AISOLUTION";
  const isOpinion = post.topicCluster === "mnenie";
  const verdict = getVerdict(post.rating);
  const byline = isOpinion ? `${t.ratingBylinePrefix} ${author.name[locale]}` : author.name[locale];

  return (
    <Link className={`post-card${isAisolutionCard ? " post-card-active" : ""}`} href={`/${locale}/blog/${post.slug}`}>
      {isAisolutionCard && (
        <>
          <span className="active-card-arrow active-card-arrow-top" aria-hidden="true">
            -&gt;
          </span>
          <span className="active-card-arrow active-card-arrow-bottom" aria-hidden="true">
            -&gt;
          </span>
        </>
      )}
      <div className="post-card-media">
        {badge === "new" && <span className="post-badge">{t.badgeNew}</span>}
        <PostCover
          cluster={post.topicCluster}
          locale={locale}
          cover={post.cover}
          label={post.coverLabel}
          logo={post.coverLogo}
        />
      </div>
      <div className="post-card-content">
        <div>
          <div className="meta">
            <span>{clusterMeta[post.topicCluster].title[locale]}</span>
            <span>{formatDate(post.publishedAt, locale)}</span>
            <span>
              {post.readMinutes} {t.min}
            </span>
          </div>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
        </div>
        <div className="card-bottom">
          <span>{byline}</span>
          {isOpinion ? (
            <span className="opinion-chip" aria-label={t.opinionChip}>
              {t.opinionChip}
            </span>
          ) : (
            <>
              <span className={`rating-verdict rating-verdict-${verdict}`} aria-label={verdict === "up" ? t.ratingVerdictUp : verdict === "average" ? t.ratingVerdictAverage : t.ratingVerdictDown}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {verdict === "up" ? (
                    <path d="M9 10V5l5 7h-3l1 7-5-7H9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  ) : verdict === "average" ? (
                    <path d="M6 12h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  ) : (
                    <path d="M9 14v5l5-7h-3l1-7-5 7H9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  )}
                </svg>
                <span>{verdict === "up" ? t.ratingVerdictUp : verdict === "average" ? t.ratingVerdictAverage : t.ratingVerdictDown}</span>
              </span>
              <span className="rating-chip" aria-label={`${t.ratingLabel}: ${post.rating} / 10`}>
                {t.ratingShort} {post.rating.toFixed(1)}
              </span>
            </>
          )}
          <span className="read-more">{t.read} -&gt;</span>
        </div>
      </div>
    </Link>
  );
}
