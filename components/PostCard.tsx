import Link from "next/link";
import type React from "react";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

type Props = {
  post: Post;
  locale: Locale;
};

export function PostCard({ post, locale }: Props) {
  const t = dictionary[locale];

  return (
    <Link className="post-card" href={`/${locale}/posts/${post.slug}`} style={{ "--accent": post.accent } as React.CSSProperties}>
      <img src={post.cover} alt="" />
      <div className="post-card-content">
        <div>
          <div className="meta">
            <span style={{ color: "var(--accent)" }}>{post.category}</span>
            <span>{formatDate(post.publishedAt, locale)}</span>
            <span>
              {post.readMinutes} {t.min}
            </span>
          </div>
          <h3>{post.title[locale]}</h3>
          <p>{post.excerpt[locale]}</p>
        </div>
        <span className="read-more">{t.read} -&gt;</span>
      </div>
    </Link>
  );
}
