"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { EditorOptions } from "@/lib/admin/editor-options";
import { renderMarkdownPreview, textStats } from "@/lib/admin/markdown-preview";
import type { Frontmatter } from "@/lib/schema";

type Props = {
  mode: "create" | "edit";
  options: EditorOptions;
  initial?: { frontmatter: Frontmatter; content: string };
  canDelete?: boolean;
};

type Form = {
  title: string; description: string; slug: string; lang: "ru" | "uz"; publishedAt: string; updatedAt: string;
  author: string; topicCluster: string; category: string; keywords: string; rating: string; cover: string;
  coverLabel: string; coverLogo: string; serviceLink: string; translationOf: string; draft: boolean; content: string;
};

type View = "write" | "preview" | "split";

const CYR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", "'": "", "ʻ": "", "ʼ": "" };

function slugify(title: string) {
  return Array.from(title.toLowerCase()).map((c) => CYR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const today = () => new Date().toISOString().slice(0, 10);

function toForm(initial: Props["initial"], options: EditorOptions): Form {
  const f = initial?.frontmatter;
  return {
    title: f?.title ?? "", description: f?.description ?? "", slug: f?.slug ?? "", lang: f?.lang ?? "uz",
    publishedAt: f?.publishedAt ?? today(), updatedAt: f?.updatedAt ?? "", author: f?.author ?? options.authors[0]?.key ?? "",
    topicCluster: f?.topicCluster ?? options.clusters[0]?.key ?? "", category: f?.category ?? "", keywords: f?.keywords.join(", ") ?? "",
    rating: f ? String(f.rating) : "7", cover: f?.cover ?? options.covers[0] ?? "", coverLabel: f?.coverLabel ?? "", coverLogo: f?.coverLogo ?? "",
    serviceLink: f?.serviceLink ?? "", translationOf: f?.translationOf ?? "", draft: f?.draft ?? false, content: initial?.content ?? ""
  };
}

/** Builds exactly the frontmatter shape lib/schema.ts expects; empty optional fields are left out. */
function toPayload(form: Form) {
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    frontmatter: {
      title: form.title.trim(), description: form.description.trim(), slug: form.slug.trim(), lang: form.lang,
      publishedAt: form.publishedAt, updatedAt: optional(form.updatedAt), author: form.author, topicCluster: form.topicCluster,
      category: optional(form.category), keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      rating: Number(form.rating), cover: form.cover.trim(), coverLabel: optional(form.coverLabel), coverLogo: optional(form.coverLogo),
      serviceLink: optional(form.serviceLink), translationOf: optional(form.translationOf), draft: form.draft
    },
    content: form.content
  };
}

/** The same rules as lib/schema.ts, checked before sending — with messages in plain Uzbek. */
function checkForm(form: Form): Map<string, string> {
  const e = new Map<string, string>();
  const t = form.title.trim().length;
  if (t < 20 || t > 70) e.set("title", `Sarlavha 20–70 belgi bo'lsin (hozir ${t}).`);
  const d = form.description.trim().length;
  if (d < 70 || d > 160) e.set("description", `Tavsif 70–160 belgi bo'lsin (hozir ${d}).`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) e.set("slug", "Faqat kichik lotin harflari, raqam va chiziqcha: masalan, ai-startap-sharhi.");
  if (!form.publishedAt) e.set("publishedAt", "Sanani tanlang.");
  const k = form.keywords.split(",").map((s) => s.trim()).filter(Boolean).length;
  if (k < 1 || k > 8) e.set("keywords", "1 tadan 8 tagacha kalit so'z yozing, vergul bilan.");
  const r = Number(form.rating);
  if (!Number.isFinite(r) || r < 1 || r > 10) e.set("rating", "Baho 1 dan 10 gacha.");
  if (!form.cover) e.set("cover", "Muqova rasmini tanlang.");
  if (form.content.trim().length < 50) e.set("content", "Matn kamida 50 belgi bo'lsin.");
  return e;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Sarlavha", description: "Qisqa tavsif", slug: "Slug (havola)", lang: "Til", publishedAt: "Chop etilgan sana", updatedAt: "Yangilangan sana",
  author: "Muallif", topicCluster: "Mavzu", category: "Kategoriya", keywords: "Kalit so'zlar", rating: "Baho", cover: "Muqova",
  coverLabel: "Muqova yozuvi", coverLogo: "Muqova logosi", serviceLink: "Xizmat havolasi", translationOf: "Boshqa tildagi nusxa (slug)", content: "Matn"
};

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  return <span className={`admin-count${n < min || n > max ? " bad" : " good"}`}>{n} / {min}–{max}</span>;
}

/** Wraps the selection in the textarea (or inserts at the start of each selected line). */
function applyFormat(area: HTMLTextAreaElement, kind: string): { value: string; start: number; end: number } {
  const { value, selectionStart: s, selectionEnd: e } = area;
  const selected = value.slice(s, e);
  const wrap = (before: string, after: string, placeholder: string) => {
    const text = selected || placeholder;
    const next = value.slice(0, s) + before + text + after + value.slice(e);
    return { value: next, start: s + before.length, end: s + before.length + text.length };
  };
  const linePrefix = (prefix: (i: number) => string) => {
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(lineStart, e) || "";
    const lines = block.split("\n").map((l, i) => prefix(i) + l.replace(/^(#{1,4}\s|>\s?|[-*]\s|\d+\.\s)/, ""));
    const joined = lines.join("\n");
    const next = value.slice(0, lineStart) + joined + value.slice(e);
    return { value: next, start: lineStart, end: lineStart + joined.length };
  };
  switch (kind) {
    case "h2": return linePrefix(() => "## ");
    case "h3": return linePrefix(() => "### ");
    case "bold": return wrap("**", "**", "qalin matn");
    case "italic": return wrap("*", "*", "kursiv");
    case "code": return wrap("`", "`", "kod");
    case "link": {
      const text = selected || "havola matni";
      const next = value.slice(0, s) + `[${text}](https://)` + value.slice(e);
      const urlStart = s + text.length + 3;
      return { value: next, start: urlStart, end: urlStart + 8 };
    }
    case "ul": return linePrefix(() => "- ");
    case "ol": return linePrefix((i) => `${i + 1}. `);
    case "quote": return linePrefix(() => "> ");
    default: return { value, start: s, end: e };
  }
}

const TOOLS: { kind: string; label: ReactNode; title: string }[] = [
  { kind: "h2", label: "H2", title: "Sarlavha" },
  { kind: "h3", label: "H3", title: "Kichik sarlavha" },
  { kind: "bold", label: <b>B</b>, title: "Qalin (Ctrl+B)" },
  { kind: "italic", label: <i>I</i>, title: "Kursiv (Ctrl+I)" },
  { kind: "link", label: "🔗", title: "Havola (Ctrl+K)" },
  { kind: "ul", label: "•", title: "Ro'yxat" },
  { kind: "ol", label: "1.", title: "Raqamli ro'yxat" },
  { kind: "quote", label: "❝", title: "Iqtibos" },
  { kind: "code", label: "</>", title: "Kod" }
];

export function PostEditor({ mode, options, initial, canDelete }: Props) {
  const router = useRouter();
  const startForm = useMemo(() => toForm(initial, options), [initial, options]);
  const [form, setForm] = useState<Form>(startForm);
  const [saved, setSaved] = useState<Form>(startForm);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [serverErrors, setServerErrors] = useState<Map<string, string>>(new Map());
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("write");
  const area = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const localErrors = useMemo(() => checkForm(form), [form]);
  const errors = useMemo(() => {
    const merged = new Map(serverErrors);
    if (showErrors) localErrors.forEach((v, k) => merged.set(k, v));
    return merged;
  }, [serverErrors, localErrors, showErrors]);
  const stats = useMemo(() => textStats(form.content), [form.content]);
  const previewHtml = useMemo(() => (view === "write" ? "" : renderMarkdownPreview(form.content)), [form.content, view]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });

  const flash = (t: { ok: boolean; text: string; url?: string }) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), t.ok ? 4000 : 7000);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const send = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      if (busy) return;
      setShowErrors(true);
      if (localErrors.size) {
        flash({ ok: false, text: `${localErrors.size} ta maydonni tuzating — ular qizil bilan belgilangan.` });
        const first = formRef.current?.querySelector<HTMLElement>(`#f-${[...localErrors.keys()][0]}`);
        first?.focus();
        return;
      }
      setBusy(true);
      const url = mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${form.lang}/${form.slug}`;
      const response = await fetch(url, { method: mode === "create" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPayload(form)) }).catch(() => null);
      setBusy(false);
      const data = await response?.json().catch(() => null);
      if (response?.ok) {
        setServerErrors(new Map());
        setShowErrors(false);
        setSaved(form);
        flash({ ok: true, text: form.draft ? "Saqlandi. Qoralama — saytda ko'rinmaydi." : "Saqlandi va saytda chiqdi.", url: form.draft ? undefined : data?.url });
        if (mode === "create") router.replace(`/admin/edit/${form.lang}/${form.slug}`);
        router.refresh();
        return;
      }
      if (!response) return flash({ ok: false, text: "Internet yoki server bilan aloqa yo'q. Matn shu yerda turibdi — keyinroq qayta saqlang." });
      if (response.status === 401) return flash({ ok: false, text: "Sessiya tugagan. Boshqa oynada qayta kiring, keyin shu yerda yana «Saqlash»ni bosing." });
      if (response.status === 409) {
        setServerErrors(new Map([["slug", "Bu slug band. Boshqa slug yozing."]]));
        return flash({ ok: false, text: "Bunday slug'li maqola allaqachon bor." });
      }
      const map = new Map<string, string>();
      if (Array.isArray(data?.errors)) for (const e of data.errors) map.set(String(e.field).split(".")[0], String(e.message));
      setServerErrors(map);
      flash({ ok: false, text: data?.error ?? "Saqlanmadi: qizil maydonlarni tuzating." });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, form, localErrors, mode]
  );

  // Ctrl/Cmd+S saves from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void send();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [send]);

  const format = (kind: string) => {
    const el = area.current;
    if (!el) return;
    const result = applyFormat(el, kind);
    set("content", result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  };

  const onAreaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    const kind = k === "b" ? "bold" : k === "i" ? "italic" : k === "k" ? "link" : null;
    if (kind) {
      e.preventDefault();
      format(kind);
    }
  };

  const remove = async () => {
    const message = mode === "edit" && initial && canDelete ? "Paneldagi nusxa o'chiriladi. Agar maqola git'da ham bo'lsa, asl nusxasi qaytadi. Davom etasizmi?" : "O'chirasizmi?";
    if (!window.confirm(message)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/posts/${form.lang}/${form.slug}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      setSaved(form);
      router.replace("/admin");
      router.refresh();
    } else {
      const data = await response?.json().catch(() => null);
      flash({ ok: false, text: data?.error ?? "O'chirib bo'lmadi." });
    }
  };

  const field = (key: keyof Form, input: ReactNode, hint?: ReactNode) => (
    <div className={`admin-field${errors.has(key) ? " has-error" : ""}`}>
      <label htmlFor={`f-${key}`}>{FIELD_LABELS[key]}</label>
      {input}
      {hint}
      {errors.has(key) && <p className="admin-error">{errors.get(key)}</p>}
    </div>
  );
  const text = (key: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`f-${key}`} value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} {...props} />
  );

  const covers = [...new Set([form.cover, ...options.covers])].filter(Boolean);

  return (
    <form ref={formRef} className="ed" onSubmit={send} noValidate>
      <div className="ed-main">
        <div className={`ed-title${errors.has("title") ? " has-error" : ""}`}>
          <textarea id="f-title" rows={1} placeholder="Maqola sarlavhasi…" value={form.title} onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))} aria-label="Sarlavha" />
          <div className="ed-under">
            <Counter value={form.title} min={20} max={70} />
            {errors.has("title") && <span className="admin-error">{errors.get("title")}</span>}
          </div>
        </div>

        <div className={`ed-desc${errors.has("description") ? " has-error" : ""}`}>
          <textarea id="f-description" rows={2} placeholder="Qisqa tavsif — Google va ijtimoiy tarmoqlarda shu ko'rinadi…" value={form.description} onChange={(e) => set("description", e.target.value)} aria-label="Qisqa tavsif" />
          <div className="ed-under">
            <Counter value={form.description} min={70} max={160} />
            {errors.has("description") && <span className="admin-error">{errors.get("description")}</span>}
          </div>
        </div>

        <div className={`ed-body${errors.has("content") ? " has-error" : ""}`}>
          <div className="ed-toolbar">
            <div className="ed-tools" role="toolbar" aria-label="Formatlash">
              {TOOLS.map((t) => (
                <button key={t.kind} type="button" title={t.title} aria-label={t.title} onClick={() => format(t.kind)} disabled={view === "preview"}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="admin-seg ed-views" role="group" aria-label="Ko'rinish">
              <button type="button" className={view === "write" ? "on" : ""} onClick={() => setView("write")}>Yozish</button>
              <button type="button" className={view === "split" ? "on" : ""} onClick={() => setView("split")} data-wide>Yonma-yon</button>
              <button type="button" className={view === "preview" ? "on" : ""} onClick={() => setView("preview")}>Ko&apos;rish</button>
            </div>
          </div>
          <div className={`ed-panes v-${view}`}>
            {view !== "preview" && (
              <textarea
                id="f-content"
                ref={area}
                className="ed-content"
                placeholder={"Matnni shu yerga yozing.\n\n## Bo'lim sarlavhasi\n\nOddiy paragraf. **Qalin**, *kursiv*, [havola](https://…)\n\n- ro'yxat\n> iqtibos"}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                onKeyDown={onAreaKey}
                aria-label="Matn"
              />
            )}
            {view !== "write" && (
              <div className="ed-preview article-content">
                <h1>{form.title || "Sarlavha"}</h1>
                {form.description && <p className="lead">{form.description}</p>}
                <div className="mdx-body" dangerouslySetInnerHTML={{ __html: previewHtml || "<p><em>Matn hali yo'q.</em></p>" }} />
              </div>
            )}
          </div>
          <div className="ed-foot">
            <span>{stats.words} so&apos;z · ~{stats.minutes} daqiqa o&apos;qish</span>
            {errors.has("content") ? <span className="admin-error">{errors.get("content")}</span> : <span className="ed-keys">Ctrl+B qalin · Ctrl+I kursiv · Ctrl+K havola · Ctrl+S saqlash</span>}
          </div>
        </div>
      </div>

      <aside className="ed-side">
        <section className="ed-card ed-publish">
          <div className="ed-publish-head">
            <span className={`ed-dot${dirty ? " dirty" : ""}`} />
            {dirty ? "Saqlanmagan o'zgarishlar bor" : mode === "create" ? "Yangi maqola" : "Hammasi saqlangan"}
          </div>
          <button type="button" className={`admin-switch big${form.draft ? "" : " on"}`} onClick={() => set("draft", !form.draft)} aria-pressed={!form.draft}>
            <i aria-hidden="true" />
            {form.draft ? "Qoralama — saytda ko'rinmaydi" : "Saytda ko'rinadi"}
          </button>
          <button type="submit" className="admin-btn primary ed-save" disabled={busy}>
            {busy ? "Saqlanmoqda…" : mode === "create" ? (form.draft ? "Qoralamani saqlash" : "Chop etish") : "Saqlash"}
            <kbd>Ctrl S</kbd>
          </button>
          <div className="ed-publish-links">
            {mode === "edit" && !saved.draft && (
              <a href={`/${form.lang}/blog/${form.slug}`} target="_blank" rel="noreferrer">Saytda ochish ↗</a>
            )}
            {canDelete && (
              <button type="button" className="ed-delete" onClick={remove} disabled={busy}>O&apos;chirish</button>
            )}
          </div>
        </section>

        <section className="ed-card">
          <h2>Asosiy</h2>
          <div className="ed-two">
            {field("lang", <select id="f-lang" value={form.lang} disabled={mode === "edit"} onChange={(e) => set("lang", e.target.value as Form["lang"])}><option value="uz">O&apos;zbekcha</option><option value="ru">Русский</option></select>)}
            {field("rating", text("rating", { type: "number", min: 1, max: 10, step: 0.1, inputMode: "decimal" }))}
          </div>
          {field(
            "slug",
            <input id="f-slug" value={form.slug} disabled={mode === "edit"} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} />,
            <small className="admin-hint">{mode === "create" ? "Sarlavhadan avtomatik yoziladi. " : ""}/{form.lang}/blog/{form.slug || "…"}</small>
          )}
          {field("author", <select id="f-author" value={form.author} onChange={(e) => set("author", e.target.value)}>{options.authors.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
          {field("topicCluster", <select id="f-topicCluster" value={form.topicCluster} onChange={(e) => set("topicCluster", e.target.value)}>{options.clusters.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</select>, form.topicCluster === "mnenie" && <small className="admin-hint">«Fikr» maqolalarida baho saytda ko&apos;rsatilmaydi.</small>)}
          {field("category", <select id="f-category" value={form.category} onChange={(e) => set("category", e.target.value)}><option value="">— yo&apos;q —</option>{options.categories.map((c) => <option key={c} value={c}>{c === "startup" ? "Startap" : c === "product" ? "Mahsulot" : c}</option>)}</select>)}
          {field("keywords", text("keywords", { placeholder: "ai, startap, toshkent" }), <small className="admin-hint">Vergul bilan, 1–8 ta</small>)}
        </section>

        <section className="ed-card">
          <h2>Muqova</h2>
          <div className={`admin-field${errors.has("cover") ? " has-error" : ""}`}>
            {form.cover && (
              <div className="ed-cover-main">
                <img src={form.cover} alt="" />
                {form.coverLabel && <span>{form.coverLabel}</span>}
              </div>
            )}
            <div className="ed-covers" role="radiogroup" aria-label="Muqova rasmi">
              {covers.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.cover === c} className={form.cover === c ? "on" : ""} onClick={() => set("cover", c)} title={c.replace("/covers/", "")}>
                  <img src={c} alt={c.replace("/covers/", "")} loading="lazy" />
                </button>
              ))}
            </div>
            {errors.has("cover") && <p className="admin-error">{errors.get("cover")}</p>}
          </div>
          {field("coverLabel", text("coverLabel", { placeholder: "masalan, CERBERUS", maxLength: 28 }), <small className="admin-hint">Rasm ustida chiqadigan qisqa yozuv (ixtiyoriy)</small>)}
        </section>

        <details className="ed-card ed-more">
          <summary>Qo&apos;shimcha sozlamalar</summary>
          {field("publishedAt", text("publishedAt", { type: "date" }))}
          {field("updatedAt", text("updatedAt", { type: "date" }), <small className="admin-hint">Katta o&apos;zgarish qilsangiz, bugungi sanani qo&apos;ying</small>)}
          {field("translationOf", text("translationOf", { placeholder: "boshqa tildagi slug" }))}
        </details>
      </aside>

      {toast && (
        <div className={`admin-toast${toast.ok ? "" : " bad"}`} role="status">
          {toast.text} {toast.url && <a href={toast.url} target="_blank" rel="noreferrer">Ochish ↗</a>}
        </div>
      )}
    </form>
  );
}
