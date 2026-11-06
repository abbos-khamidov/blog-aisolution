/**
 * Extra rules for posts written in the admin panel. Pure functions with no
 * Node imports, so the editor (browser) and the API (server) share them.
 */

/** Code blocks and inline code are shown as text, so tags inside them are harmless. */
function withoutCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?(```|$)/g, "").replace(/~~~[\s\S]*?(~~~|$)/g, "").replace(/`[^`\n]*`/g, "");
}

/**
 * MDX renders raw HTML/JSX tags as real elements, so a stolen admin session
 * could otherwise put <script>/<iframe> on the public site. Repo posts use none
 * of this, so the rules cost nothing.
 */
export function unsafeContentReason(content: string): string | null {
  const text = withoutCode(content);
  if (/<\/?[A-Za-z!?]/.test(text)) return "HTML/JSX teglar ruxsat etilmaydi — Markdown ishlating: ## sarlavha, **qalin**, [havola](https://…)";
  if (/\]\(\s*<?\s*(javascript|vbscript|data|file):/i.test(text) || /^\s*\[[^\]]+\]:\s*<?\s*(javascript|vbscript|data|file):/im.test(text)) {
    return "Havola https://, http:// yoki / bilan boshlanishi kerak";
  }
  if (/[{}]/.test(text.replace(/\\[{}]/g, ""))) return "{ } qavslar ruxsat etilmaydi (MDX ularni kod deb o'qiydi). Kerak bo'lsa \\{ \\} deb yozing";
  return null;
}

/** Site-local path: "/covers/x.png" — not "//evil.com", not "/../", no backslashes or schemes. */
const LOCAL_PATH = /^\/(?!\/)[A-Za-z0-9._~\-/]*$/;

export function isLocalPath(value: string): boolean {
  return LOCAL_PATH.test(value) && !value.includes("..");
}

export const PATH_FIELDS = ["cover", "coverLogo", "serviceLink"] as const;

/** Angle brackets in a title or description could break out of the JSON-LD <script> tag. */
export function frontmatterTextReason(value: string): string | null {
  if (/[<>]/.test(value)) return "< va > belgilaridan foydalanib bo'lmaydi";
  return null;
}
