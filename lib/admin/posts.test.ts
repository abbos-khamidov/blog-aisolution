import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { isLocale, isSlug, toMdx, validatePostInput } from "./posts";

const valid = {
  frontmatter: {
    title: "Admin paneldan yozilgan sinov maqolasi",
    description: "Bu maqola admin panel orqali qo'shildi: git kerak emas, saqlagan zahoti saytda chiqadi va tekshiriladi.",
    slug: "admin-sinov-maqolasi",
    lang: "uz",
    publishedAt: "2026-10-20",
    author: "abbas-khamidov",
    topicCluster: "vnedrenie",
    keywords: ["admin", "blog"],
    rating: 7.2,
    cover: "/covers/startup-team.png",
    draft: false
  },
  content: "## Sarlavha\n\nBu yerda kamida ellik belgidan iborat haqiqiy matn bo'lishi kerak, aks holda saqlanmaydi."
};

describe("admin post validation", () => {
  it("accepts a valid post", () => {
    expect(validatePostInput(valid).ok).toBe(true);
  });

  it("uses the same rules as repo posts", () => {
    const result = validatePostInput({ ...valid, frontmatter: { ...valid.frontmatter, title: "short", slug: "Bad Slug!", rating: 0 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const fields = result.errors.map((e) => e.field);
      expect(fields.includes("title")).toBe(true);
      expect(fields.includes("slug")).toBe(true);
      expect(fields.includes("rating")).toBe(true);
    }
  });

  it("rejects unknown authors, short text and junk bodies", () => {
    const unknown = validatePostInput({ ...valid, frontmatter: { ...valid.frontmatter, author: "hacker" } });
    expect(unknown.ok).toBe(false);
    expect(validatePostInput({ ...valid, content: "kalta" }).ok).toBe(false);
    expect(validatePostInput(null).ok).toBe(false);
    expect(validatePostInput("text").ok).toBe(false);
  });

  it("writes MDX that reads back to the same post", () => {
    const result = validatePostInput(valid);
    if (!result.ok) throw new Error("expected valid");
    const parsed = matter(toMdx(result.post));
    expect(parsed.data.slug).toBe("admin-sinov-maqolasi");
    expect(parsed.data.rating).toBe(7.2);
    expect(parsed.content.trim()).toBe(valid.content);
  });
});

describe("path safety", () => {
  it("only allows known locales and kebab-case slugs", () => {
    expect(isLocale("uz")).toBe(true);
    expect(isLocale("../etc")).toBe(false);
    expect(isSlug("ok-slug-2")).toBe(true);
    expect(isSlug("../../passwd")).toBe(false);
    expect(isSlug("Upper")).toBe(false);
  });
});
