"use client";

import { FormEvent, useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { posts as seedPosts, type Post } from "@/lib/posts";

const storageKey = "aisolution_blog_posts_v1";
const adminKey = "aisolution_pulse_unlocked";
const password = "aisolution";

const emptyPost: Post = {
  id: "",
  slug: "",
  status: "published",
  category: "CRM",
  accent: "#00d2ff",
  publishedAt: new Date().toISOString().slice(0, 10),
  readMinutes: 4,
  cover: "/images/aisolution-blog-hero.png",
  title: { ru: "", uz: "" },
  excerpt: { ru: "", uz: "" },
  body: { ru: [], uz: [] },
  tags: []
};

export function PulseAdmin() {
  const [unlocked, setUnlocked] = useState(false);
  const [gateValue, setGateValue] = useState("");
  const [storedPosts, setStoredPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<Post>(emptyPost);
  const [bodyRu, setBodyRu] = useState("");
  const [bodyUz, setBodyUz] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(adminKey) === "1");
    const rawPosts = localStorage.getItem(storageKey);
    setStoredPosts(rawPosts ? JSON.parse(rawPosts) : []);
  }, []);

  const allPosts = [...storedPosts, ...seedPosts.filter((seed) => !storedPosts.some((post) => post.slug === seed.slug))];

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (gateValue === password) {
      sessionStorage.setItem(adminKey, "1");
      setUnlocked(true);
    }
  }

  function persist(nextPosts: Post[]) {
    setStoredPosts(nextPosts);
    localStorage.setItem(storageKey, JSON.stringify(nextPosts));
  }

  function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPost: Post = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      body: {
        ru: splitParagraphs(bodyRu),
        uz: splitParagraphs(bodyUz)
      },
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      cover: "/images/aisolution-blog-hero.png"
    };

    persist([nextPost, ...storedPosts.filter((post) => post.id !== nextPost.id && post.slug !== nextPost.slug)]);
    reset();
  }

  function edit(post: Post) {
    setDraft(post);
    setBodyRu(post.body.ru.join("\n\n"));
    setBodyUz(post.body.uz.join("\n\n"));
    setTags(post.tags.join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setDraft({ ...emptyPost, publishedAt: new Date().toISOString().slice(0, 10) });
    setBodyRu("");
    setBodyUz("");
    setTags("");
  }

  function exportPosts() {
    const blob = new Blob([JSON.stringify(storedPosts, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "aisolution-blog-posts.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="admin-body">
      <div className="admin-shell">
        {!unlocked ? (
          <section className="admin-gate">
            <Brand href="/ru" />
            <h1>Редакторский вход</h1>
            <p>Скрытая MVP-панель для черновиков и публикаций. Пароль локальный, для реального запуска нужен backend-auth.</p>
            <form onSubmit={unlock}>
              <input value={gateValue} onChange={(event) => setGateValue(event.target.value)} type="password" placeholder="Код доступа" autoComplete="current-password" />
              <button className="button primary" type="submit">
                Войти
              </button>
            </form>
          </section>
        ) : (
          <section className="admin-panel">
            <div className="admin-top">
              <div>
                <p className="kicker">AISOLUTION pulse</p>
                <h1>Публикации блога</h1>
              </div>
              <div className="admin-actions">
                <button className="button ghost" type="button" onClick={exportPosts}>
                  Экспорт JSON
                </button>
                <a className="button primary" href="/ru">
                  Открыть блог
                </a>
              </div>
            </div>

            <form className="editor-form" onSubmit={savePost}>
              <label>
                Slug
                <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} required placeholder="ai-crm-market-pulse" />
              </label>
              <label>
                Статус
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Post["status"] })}>
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                </select>
              </label>
              <label>
                Категория
                <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required placeholder="CRM" />
              </label>
              <label>
                Цвет акцента
                <input value={draft.accent} onChange={(event) => setDraft({ ...draft, accent: event.target.value })} type="color" />
              </label>
              <label>
                Дата
                <input value={draft.publishedAt} onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })} type="date" required />
              </label>
              <label>
                Минут чтения
                <input value={draft.readMinutes} onChange={(event) => setDraft({ ...draft, readMinutes: Number(event.target.value) })} type="number" min="1" />
              </label>
              <label className="wide">
                Заголовок RU
                <input value={draft.title.ru} onChange={(event) => setDraft({ ...draft, title: { ...draft.title, ru: event.target.value } })} required />
              </label>
              <label className="wide">
                Заголовок UZ
                <input value={draft.title.uz} onChange={(event) => setDraft({ ...draft, title: { ...draft.title, uz: event.target.value } })} required />
              </label>
              <label className="wide">
                Анонс RU
                <textarea value={draft.excerpt.ru} onChange={(event) => setDraft({ ...draft, excerpt: { ...draft.excerpt, ru: event.target.value } })} required rows={3} />
              </label>
              <label className="wide">
                Анонс UZ
                <textarea value={draft.excerpt.uz} onChange={(event) => setDraft({ ...draft, excerpt: { ...draft.excerpt, uz: event.target.value } })} required rows={3} />
              </label>
              <label className="wide">
                Текст RU
                <textarea value={bodyRu} onChange={(event) => setBodyRu(event.target.value)} required rows={7} />
              </label>
              <label className="wide">
                Текст UZ
                <textarea value={bodyUz} onChange={(event) => setBodyUz(event.target.value)} required rows={7} />
              </label>
              <label className="wide">
                Теги через запятую
                <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="aisolution, ai solution, crm" />
              </label>
              <div className="form-actions wide">
                <button className="button primary" type="submit">
                  Сохранить публикацию
                </button>
                <button className="button ghost" type="button" onClick={reset}>
                  Очистить
                </button>
              </div>
            </form>

            <div className="admin-list">
              {allPosts.map((post) => (
                <div className="admin-item" key={post.id}>
                  <div>
                    <strong>{post.title.ru || post.slug}</strong>
                    <small>
                      {post.status} / {post.category} / {post.publishedAt}
                    </small>
                  </div>
                  <button className="button ghost" type="button" onClick={() => edit(post)}>
                    Редактировать
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function splitParagraphs(value: string) {
  return value.split(/\n\n+/).map((item) => item.trim()).filter(Boolean);
}
