import Link from "next/link";
import { resolveAuthor } from "@/lib/authors";
import { clusterMeta, formatDate, type Post } from "@/lib/content";
import { dictionary, type Locale } from "@/lib/i18n";

type Props = {
  post: Post;
  locale: Locale;
};

/**
 * Card for posts sourced from lib/content.ts (the MDX/zod pipeline).
 * Deliberately separate from components/PostCard.tsx, which renders the
 * older lib/posts.ts shape — the two Post types aren't compatible, and this
 * one stays independent so it doesn't collide with in-progress design work
 * on that file.
 */
export function ContentPostCard({ post, locale }: Props) {
  const t = dictionary[locale];
  const author = resolveAuthor(post.author);

  return (
    <Link className="post-card" href={`/${locale}/blog/${post.slug}`}>
      <div className="post-card-media">
        <img src={post.cover} alt="" />
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
          <span>{author.name[locale]}</span>
          <span className="read-more">{t.read} -&gt;</span>
        </div>
      </div>
    </Link>
  );
}
