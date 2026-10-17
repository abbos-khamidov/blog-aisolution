import type { CSSProperties } from "react";
import Link from "next/link";
import { CardActions } from "./CardActions";
import { PostCover } from "./PostCover";
import { resolveAuthor } from "@/lib/authors";
import { clusterMeta, formatDate, getVerdict, type Post } from "@/lib/post-display";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  post: Post;
  locale: Locale;
  badge?: "new";
};

/**
 * Card for posts sourced from lib/content.ts (the MDX/zod pipeline).
 * The title link is stretched over the whole card (CSS ::after), so the card
 * stays one big click target while the like/save buttons remain real buttons
 * — a <button> nested inside an <a> would be invalid HTML.
 */
export function ContentPostCard({ post, locale, badge }: Props) {
  const t = dictionary[locale];
  const isOpinion = post.topicCluster === "mnenie";
  const verdict = getVerdict(post.rating);
  const verdictLabel =
    verdict === "up" ? t.ratingVerdictUp : verdict === "average" ? t.ratingVerdictAverage : t.ratingVerdictDown;

  return (
    <article className="post-card">
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
        <p className="post-card-kicker">
          <span>{clusterMeta[post.topicCluster].title[locale]}</span>
          <span>
            {formatDate(post.publishedAt, locale)} · {post.readMinutes} {t.min}
          </span>
        </p>
        <h3>
          <Link className="post-card-link" href={`/${locale}/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        <div className="post-card-footer">
          {isOpinion ? (
            <span className="opinion-chip">
              {t.opinionChip} · {resolveAuthor(post.author).name[locale]}
            </span>
          ) : (
            <span className={`post-card-score verdict-${verdict}`} aria-label={`${t.ratingLabel}: ${post.rating} / 10`}>
              <strong>{post.rating.toFixed(1)}</strong> · {verdictLabel}
            </span>
          )}
          <CardActions locale={locale} slug={post.slug} />
        </div>
        {!isOpinion && (
          <div className="score-bar" style={{ "--score": `${post.rating * 10}%` } as CSSProperties} aria-hidden="true">
            <i />
          </div>
        )}
      </div>
    </article>
  );
}
