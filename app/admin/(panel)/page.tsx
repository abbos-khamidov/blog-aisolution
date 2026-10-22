import { PostList, type PostRow } from "@/components/admin/PostList";
import { getAllPosts, getPostSources, hasRepoPost } from "@/lib/content";
import { formatDate } from "@/lib/post-display";

export default function AdminPostsPage() {
  const sources = getPostSources();
  const rows: PostRow[] = getAllPosts()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((post) => {
      const source = sources.get(`${post.lang}/${post.slug}`) ?? "repo";
      return {
        lang: post.lang,
        slug: post.slug,
        title: post.title,
        date: post.publishedAt,
        dateLabel: formatDate(post.publishedAt, "uz"),
        score: post.topicCluster === "mnenie" ? "fikr" : `★ ${post.rating.toFixed(1)}`,
        cover: post.cover,
        source,
        overrides: source === "admin" && hasRepoPost(post.lang, post.slug),
        draft: Boolean(post.draft)
      };
    });

  return <PostList rows={rows} />;
}
