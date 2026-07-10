import { describe, expect, it } from "vitest";
import { authors, isKnownAuthor, listAuthors, resolveAuthor, UnknownAuthorError } from "./authors";

describe("authors registry", () => {
  it("has abbas-khamidov as the founder", () => {
    const author = resolveAuthor("abbas-khamidov");
    expect(author.isFounder).toBe(true);
    expect(author.name.ru).toContain("Abbas");
  });

  it("throws UnknownAuthorError with a readable message for an unregistered key", () => {
    expect(() => resolveAuthor("random-student")).toThrow(UnknownAuthorError);
    try {
      resolveAuthor("random-student");
    } catch (error) {
      expect((error as Error).message).toContain("random-student");
      expect((error as Error).message).toContain("aisolution");
    }
  });

  it("isKnownAuthor reflects registry membership", () => {
    expect(isKnownAuthor("abbas-khamidov")).toBe(true);
    expect(isKnownAuthor("aisolution")).toBe(true);
    expect(isKnownAuthor("nobody")).toBe(false);
  });

  it("listAuthors returns every registered author", () => {
    expect(listAuthors()).toHaveLength(Object.keys(authors).length);
  });

  it("every author has both locales for name/role/bio", () => {
    for (const author of listAuthors()) {
      expect(author.name.ru).toBeTruthy();
      expect(author.name.uz).toBeTruthy();
      expect(author.role.ru).toBeTruthy();
      expect(author.role.uz).toBeTruthy();
      expect(author.bio.ru).toBeTruthy();
      expect(author.bio.uz).toBeTruthy();
      expect(author.image.startsWith("/")).toBe(true);
    }
  });
});
