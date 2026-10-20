import Link from "next/link";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getEditorOptions } from "@/lib/admin/editor-options";
import { isLocale, isSlug } from "@/lib/admin/posts";
import { getPostForAdmin, getPostSources, hasRepoPost } from "@/lib/content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function EditPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSlug(slug)) notFound();
  const post = getPostForAdmin(locale, slug);
  if (!post) notFound();
  const { content, readMinutes: _m, ...frontmatter } = post;
  const source = getPostSources().get(`${locale}/${slug}`) ?? "repo";

  return (
    <>
      <div className="admin-head compact">
        <Link href="/admin" className="admin-back">← Maqolalar</Link>
        <h1>Tahrirlash</h1>
        <p>
          {source === "repo"
            ? "Bu maqola git'da turibdi. Saqlasangiz, saytda sizning nusxangiz ko'rinadi; git'dagi asl fayl o'zgarmaydi."
            : hasRepoPost(locale, slug)
              ? "Bu git'dagi maqolaning admin nusxasi. «O'chirish» asl nusxani qaytaradi."
              : "Admin paneldan qo'shilgan maqola."}
        </p>
      </div>
      <PostEditor mode="edit" options={getEditorOptions()} initial={{ frontmatter, content }} canDelete={source === "admin"} />
    </>
  );
}
