import { describe, expect, it } from "vitest";
import { topicClusters } from "./schema";
import {
  clusterMeta,
  getClustersInUse,
  getPostBySlug,
  getPostsByAuthor,
  getPublishedPosts,
  getRelatedPosts,
  getTranslation
} from "./content";

describe("content pipeline (reads real content/ directory)", () => {
  it("loads the ru demo post and resolves its uz translation", () => {
    const post = getPostBySlug("ru", "vnedrenie-ii-otdel-prodazh");
    expect(post).toBeDefined();
    expect(post?.author).toBe("aisolution");
    expect(post?.draft).toBe(false);

    const translation = post && getTranslation(post);
    expect(translation?.slug).toBe("sunaiy-intellekt-savdo-bolimida");
    expect(translation?.lang).toBe("uz");
  });

  it("resolves the translation link symmetrically from the uz side", () => {
    const post = getPostBySlug("uz", "sunaiy-intellekt-savdo-bolimida");
    const translation = post && getTranslation(post);
    expect(translation?.slug).toBe("vnedrenie-ii-otdel-prodazh");
  });

  it("returns published posts sorted by publishedAt desc", () => {
    const posts = getPublishedPosts("ru");
    const dates = posts.map((post) => post.publishedAt);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("getRelatedPosts never includes the post itself", () => {
    const post = getPostBySlug("ru", "vnedrenie-ii-otdel-prodazh");
    expect(post).toBeDefined();
    const related = post ? getRelatedPosts(post) : [];
    expect(related.every((candidate) => candidate.slug !== post?.slug)).toBe(true);
  });

  it("getPostsByAuthor only returns that author's posts", () => {
    const posts = getPostsByAuthor("aisolution", "ru");
    expect(posts.every((post) => post.author === "aisolution")).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
  });

  it("getClustersInUse only lists clusters that actually have published posts", () => {
    const used = getClustersInUse();
    expect(used).toContain("vnedrenie");
    expect(used.every((cluster) => (topicClusters as readonly string[]).includes(cluster))).toBe(true);
  });

  it("clusterMeta has a ru/uz title and description for every topicCluster", () => {
    for (const cluster of topicClusters) {
      const meta = clusterMeta[cluster];
      expect(meta.title.ru).toBeTruthy();
      expect(meta.title.uz).toBeTruthy();
      expect(meta.description.ru).toBeTruthy();
      expect(meta.description.uz).toBeTruthy();
    }
  });
});
