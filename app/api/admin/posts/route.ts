import { NextResponse } from "next/server";
import { adminPostExists, saveAdminPost, validatePostInput } from "@/lib/admin/posts";
import { refreshSite } from "@/lib/admin/publish";
import { noStore, requireAdmin } from "@/lib/admin/request";
import { getAllPosts, getPostSources, hasRepoPost } from "@/lib/content";

export const dynamic = "force-dynamic";

/** List every post (drafts included) with where it comes from. */
export async function GET(request: Request) {
  const blocked = await requireAdmin(request);
  if (blocked) return blocked;
  const sources = getPostSources();
  const posts = getAllPosts().map(({ content: _content, ...meta }) => ({
    ...meta,
    source: sources.get(`${meta.lang}/${meta.slug}`) ?? "repo",
    overridesRepo: sources.get(`${meta.lang}/${meta.slug}`) === "admin" && hasRepoPost(meta.lang, meta.slug)
  }));
  return NextResponse.json({ posts }, { headers: noStore });
}

/** Create a new post. */
export async function POST(request: Request) {
  const blocked = await requireAdmin(request, { write: true });
  if (blocked) return blocked;
  const result = validatePostInput(await request.json().catch(() => null));
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422, headers: noStore });

  const { lang, slug } = result.post.frontmatter;
  if (adminPostExists(lang, slug) || hasRepoPost(lang, slug)) {
    return NextResponse.json({ errors: [{ field: "slug", message: "a post with this slug already exists" }] }, { status: 409, headers: noStore });
  }
  saveAdminPost(result.post);
  refreshSite();
  return NextResponse.json({ ok: true, url: `/${lang}/blog/${slug}` }, { status: 201, headers: noStore });
}
