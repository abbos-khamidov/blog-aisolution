import { describe, expect, it } from "vitest";
import { FrontmatterValidationError, parseFrontmatter } from "./schema";

const validFrontmatter = {
  title: "Внедрение ИИ в отдел продаж: с чего начать бизнесу",
  description:
    "Разбираем, какие шаги реально нужны компании перед внедрением ИИ в продажи и где чаще всего теряют деньги на старте.",
  slug: "vnedrenie-ii-otdel-prodazh",
  lang: "ru",
  publishedAt: "2026-07-09",
  author: "aisolution",
  topicCluster: "vnedrenie",
  keywords: ["внедрение ии", "автоматизация продаж"],
  cover: "/covers/vnedrenie-ii-otdel-prodazh.png"
};

describe("frontmatterSchema", () => {
  it("accepts a valid frontmatter object and fills defaults", () => {
    const result = parseFrontmatter("test.mdx", validFrontmatter);
    expect(result.draft).toBe(false);
    expect(result.slug).toBe("vnedrenie-ii-otdel-prodazh");
  });

  it("throws FrontmatterValidationError with the file name on missing required fields", () => {
    const { author, ...withoutAuthor } = validFrontmatter;
    expect(() => parseFrontmatter("content/ru/broken.mdx", withoutAuthor)).toThrow(
      FrontmatterValidationError
    );
    try {
      parseFrontmatter("content/ru/broken.mdx", withoutAuthor);
    } catch (error) {
      expect(error).toBeInstanceOf(FrontmatterValidationError);
      expect((error as Error).message).toContain("content/ru/broken.mdx");
      expect((error as Error).message).toContain("author");
    }
  });

  it("rejects a title outside the 20-70 character range", () => {
    expect(() => parseFrontmatter("t.mdx", { ...validFrontmatter, title: "Коротко" })).toThrow();
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, title: "А".repeat(71) })
    ).toThrow();
  });

  it("rejects a description outside the 70-160 character range", () => {
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, description: "Слишком коротко" })
    ).toThrow();
  });

  it("rejects a non-kebab-case slug", () => {
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, slug: "Vnedrenie_II otdel" })
    ).toThrow();
  });

  it("rejects an unknown topicCluster", () => {
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, topicCluster: "marketing" })
    ).toThrow();
  });

  it("rejects zero keywords and more than 8 keywords", () => {
    expect(() => parseFrontmatter("t.mdx", { ...validFrontmatter, keywords: [] })).toThrow();
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, keywords: Array(9).fill("kw") })
    ).toThrow();
  });

  it("rejects an invalid calendar date like 2026-13-40", () => {
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, publishedAt: "2026-13-40" })
    ).toThrow();
  });

  it("rejects cover/serviceLink paths that don't start with /", () => {
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, cover: "covers/x.png" })
    ).toThrow();
    expect(() =>
      parseFrontmatter("t.mdx", { ...validFrontmatter, serviceLink: "vnedrenie-ii" })
    ).toThrow();
  });

  it("rejects translationOf pointing at its own slug", () => {
    expect(() =>
      parseFrontmatter("t.mdx", {
        ...validFrontmatter,
        translationOf: validFrontmatter.slug
      })
    ).toThrow();
  });

  it("rejects updatedAt earlier than publishedAt", () => {
    expect(() =>
      parseFrontmatter("t.mdx", {
        ...validFrontmatter,
        publishedAt: "2026-07-09",
        updatedAt: "2026-07-01"
      })
    ).toThrow();
  });

  it("accepts a valid translationOf/updatedAt/serviceLink combination", () => {
    const result = parseFrontmatter("t.mdx", {
      ...validFrontmatter,
      translationOf: "sunaiy-intellekt-savdo-bolimida",
      updatedAt: "2026-07-10",
      serviceLink: "/services/ai-crm"
    });
    expect(result.translationOf).toBe("sunaiy-intellekt-savdo-bolimida");
  });
});
