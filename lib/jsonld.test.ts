import { describe, expect, it } from "vitest";
import { getPostBySlug } from "./content";
import {
  ORGANIZATION_ID,
  articleId,
  buildArticleGraph,
  buildAuthorGraph,
  buildOrganizationNode,
  buildWebsiteGraph,
  findDanglingReferences,
  personId
} from "./jsonld";

describe("jsonld @graph builders", () => {
  it("Organization.@id and Person.@id live on the main domain, not the blog", () => {
    expect(ORGANIZATION_ID.startsWith("https://aisolution.uz/")).toBe(true);
    expect(personId("abbas-khamidov").startsWith("https://aisolution.uz/")).toBe(true);
  });

  it("buildOrganizationNode.founder resolves to a real registered founder", () => {
    const org = buildOrganizationNode();
    expect(org.founder["@id"]).toBe(personId("abbas-khamidov"));
  });

  it("buildArticleGraph has zero dangling @id references for the demo post", () => {
    const post = getPostBySlug("ru", "vnedrenie-ii-otdel-prodazh");
    expect(post).toBeDefined();
    if (!post) return;

    const graph = buildArticleGraph(post);
    expect(graph["@context"]).toBe("https://schema.org");
    expect(findDanglingReferences(graph)).toEqual([]);

    const blogPosting = graph["@graph"].find((node) => node["@type"] === "BlogPosting");
    expect(blogPosting?.["@id"]).toBe(articleId("ru", "vnedrenie-ii-otdel-prodazh"));
  });

  it("buildArticleGraph doesn't duplicate the Person node when author is the founder", () => {
    const post = getPostBySlug("ru", "pochemu-ocenki-startapov-dolzhny-byt-zhestkimi");
    expect(post).toBeDefined();
    if (!post) return;

    const graph = buildArticleGraph(post);
    const personNodes = graph["@graph"].filter((node) => node["@type"] === "Person");
    expect(personNodes).toHaveLength(1);
  });

  it("buildWebsiteGraph and buildAuthorGraph also have zero dangling references", () => {
    expect(findDanglingReferences(buildWebsiteGraph())).toEqual([]);
    expect(findDanglingReferences(buildAuthorGraph("abbas-khamidov"))).toEqual([]);
  });

  it("every page's @graph contains exactly one Organization node with the shared @id", () => {
    const post = getPostBySlug("ru", "vnedrenie-ii-otdel-prodazh");
    expect(post).toBeDefined();
    if (!post) return;

    for (const graph of [buildArticleGraph(post), buildWebsiteGraph(), buildAuthorGraph("abbas-khamidov")]) {
      const orgNodes = graph["@graph"].filter((node) => node["@type"] === "Organization");
      expect(orgNodes).toHaveLength(1);
      expect(orgNodes[0]["@id"]).toBe(ORGANIZATION_ID);
    }
  });
});
