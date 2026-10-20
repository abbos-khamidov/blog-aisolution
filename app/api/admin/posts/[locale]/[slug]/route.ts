import { NextResponse } from "next/server";
import { deleteAdminPost, isLocale, isSlug, saveAdminPost, validatePostInput } from "@/lib/admin/posts";
import { refreshSite } from "@/lib/admin/publish";
import { deny, noStore, requireAdmin } from "@/lib/admin/request";
import { getPostForAdmin, getPostSources } from "@/lib/content";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ locale: string; slug: string }> };

async function target(ctx: Ctx) {
  const { locale, slug } = await ctx.params;
  if (!isLocale(locale) || !isSlug(slug)) return null;
  return { locale, slug };
}

/** One post with its full text, for the editor. */
export async function GET(request: Request, ctx: Ctx) {
  const blocked = await requireAdmin(request);
  if (blocked) return blocked;
  const t = await target(ctx);
  const post = t && getPostForAdmin(t.locale, t.slug);
  if (!post) return deny(404, "Post not found");
  const { content, readMinutes: _m, ...frontmatter } = post;
  return NextResponse.json({ frontmatter, content, source: getPostSources().get(`${t.locale}/${t.slug}`) ?? "repo" }, { headers: noStore });
}

/** Save changes. Editing a repo post stores an admin copy that replaces it on the site. */
export async function PUT(request: Request, ctx: Ctx) {
  const blocked = await requireAdmin(request, { write: true });
  if (blocked) return blocked;
  const t = await target(ctx);
  if (!t || !getPostForAdmin(t.locale, t.slug)) return deny(404, "Post not found");

  const result = validatePostInput(await request.json().catch(() => null));
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422, headers: noStore });
  if (result.post.frontmatter.lang !== t.locale || result.post.frontmatter.slug !== t.slug) {
    return NextResponse.json({ errors: [{ field: "slug", message: "slug and language can't change — create a new post instead" }] }, { status: 422, headers: noStore });
  }
  saveAdminPost(result.post);
  refreshSite();
  return NextResponse.json({ ok: true, url: `/${t.locale}/blog/${t.slug}` }, { headers: noStore });
}

/** Quick switch from the list: publish or hide a post without opening the editor. Body: { draft: boolean }. */
export async function PATCH(request: Request, ctx: Ctx) {
  const blocked = await requireAdmin(request, { write: true });
  if (blocked) return blocked;
  const t = await target(ctx);
  const post = t && getPostForAdmin(t.locale, t.slug);
  if (!t || !post) return deny(404, "Post not found");

  const body = (await request.json().catch(() => null)) as { draft?: unknown } | null;
  if (typeof body?.draft !== "boolean") return deny(422, "draft must be true or false");
  const { content, readMinutes: _m, ...frontmatter } = post;
  const result = validatePostInput({ frontmatter: { ...frontmatter, draft: body.draft }, content });
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422, headers: noStore });
  saveAdminPost(result.post);
  refreshSite();
  return NextResponse.json({ ok: true, draft: body.draft }, { headers: noStore });
}

/** Delete an admin post. For a repo post this removes the admin copy, so the original comes back. */
export async function DELETE(request: Request, ctx: Ctx) {
  const blocked = await requireAdmin(request, { write: true });
  if (blocked) return blocked;
  const t = await target(ctx);
  if (!t) return deny(404, "Post not found");
  if (!deleteAdminPost(t.locale, t.slug)) {
    return deny(409, "This post lives in the git repository. To hide it, edit it and tick “Draft”.");
  }
  refreshSite();
  return NextResponse.json({ ok: true }, { headers: noStore });
}
