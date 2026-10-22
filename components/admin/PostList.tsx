"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type PostRow = {
  lang: "ru" | "uz";
  slug: string;
  title: string;
  date: string;
  dateLabel: string;
  score: string;
  cover: string;
  source: "repo" | "admin";
  overrides: boolean;
  draft: boolean;
};

type Status = "all" | "live" | "draft" | "admin";

const STATUS_LABELS: Record<Status, string> = { all: "Hammasi", live: "Saytda", draft: "Qoralama", admin: "Paneldan" };

export function PostList({ rows }: { rows: PostRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"all" | "uz" | "ru">("all");
  const [status, setStatus] = useState<Status>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const isDraft = (row: PostRow) => drafts[`${row.lang}/${row.slug}`] ?? row.draft;

  const counts = useMemo(() => {
    const c = { all: rows.length, live: 0, draft: 0, admin: 0 };
    for (const r of rows) {
      if (isDraft(r)) c.draft++;
      else c.live++;
      if (r.source === "admin") c.admin++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, drafts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (lang !== "all" && r.lang !== lang) return false;
      if (status === "live" && isDraft(r)) return false;
      if (status === "draft" && !isDraft(r)) return false;
      if (status === "admin" && r.source !== "admin") return false;
      return !q || r.title.toLowerCase().includes(q) || r.slug.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, lang, status, drafts]);

  const toggleDraft = async (row: PostRow) => {
    const key = `${row.lang}/${row.slug}`;
    const next = !isDraft(row);
    setBusy(key);
    const response = await fetch(`/api/admin/posts/${row.lang}/${row.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: next })
    }).catch(() => null);
    setBusy(null);
    if (response?.ok) {
      setDrafts((d) => ({ ...d, [key]: next }));
      setToast({ ok: true, text: next ? "Yashirildi — saytda ko'rinmaydi." : "Chop etildi — saytda ko'rinadi." });
      router.refresh();
    } else if (response?.status === 401) {
      setToast({ ok: false, text: "Sessiya tugagan, qayta kiring." });
    } else {
      setToast({ ok: false, text: "O'zgartirib bo'lmadi. Maqolani ochib tekshiring." });
    }
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <>
      <div className="admin-head">
        <h1>Maqolalar</h1>
        <p>Maqolani bosib tahrirlang. O&apos;zgarish saqlangan zahoti saytda ko&apos;rinadi.</p>
      </div>

      <div className="admin-stats" role="tablist" aria-label="Holat bo'yicha">
        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={status === s} className={`admin-stat${status === s ? " on" : ""}`} onClick={() => setStatus(s)}>
            <b>{counts[s]}</b>
            <span>{STATUS_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <div className="admin-filters">
        <input type="search" placeholder="Sarlavha yoki slug bo'yicha qidirish…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Qidirish" />
        <div className="admin-seg" role="group" aria-label="Til">
          {(["all", "uz", "ru"] as const).map((l) => (
            <button key={l} type="button" className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
              {l === "all" ? "Barchasi" : l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="admin-empty">Hech narsa topilmadi.</p>
      ) : (
        <ul className="admin-list">
          {visible.map((row) => {
            const key = `${row.lang}/${row.slug}`;
            const draft = isDraft(row);
            return (
              <li key={key} className={`admin-row${draft ? " is-draft" : ""}`}>
                <Link href={`/admin/edit/${row.lang}/${row.slug}`} className="admin-row-main">
                  <img src={row.cover} alt="" loading="lazy" />
                  <span className="admin-row-text">
                    <strong>{row.title}</strong>
                    <span className="admin-row-meta">
                      <em>{row.lang.toUpperCase()}</em>
                      <span>{row.dateLabel}</span>
                      <span>{row.score}</span>
                      {row.source === "admin" && <span className="admin-tag admin">{row.overrides ? "paneldan o'zgargan" : "paneldan"}</span>}
                      {draft && <span className="admin-tag draft">qoralama</span>}
                    </span>
                  </span>
                </Link>
                <div className="admin-row-actions">
                  <button type="button" className={`admin-switch${draft ? "" : " on"}`} onClick={() => toggleDraft(row)} disabled={busy === key} aria-pressed={!draft} title={draft ? "Saytga chiqarish" : "Saytdan yashirish"}>
                    <i aria-hidden="true" />
                    {draft ? "Yashirin" : "Saytda"}
                  </button>
                  {!draft && (
                    <a href={`/${row.lang}/blog/${row.slug}`} target="_blank" rel="noreferrer" className="admin-icon-link" title="Saytda ochish">
                      ↗
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div className={`admin-toast${toast.ok ? "" : " bad"}`} role="status">
          {toast.text}
        </div>
      )}
    </>
  );
}
