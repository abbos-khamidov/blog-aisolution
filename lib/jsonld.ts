import { type Author, listAuthors, resolveAuthor } from "./authors";
import { clusterMeta, type Post } from "./content";
import { type Locale, locales } from "./i18n";

/**
 * Organization.@id and Person.@id deliberately live on the MAIN domain, not
 * on blog.aisolution.uz — that's what lets Google merge the blog's entities
 * into the same knowledge-graph node as the main site (claude.md, задача 3).
 */
const MAIN_ORIGIN = "https://aisolution.uz";
const BLOG_ORIGIN = "https://blog.aisolution.uz";

export const ORGANIZATION_ID = `${MAIN_ORIGIN}/#organization`;
export const WEBSITE_ID = `${BLOG_ORIGIN}/#website`;

export function personId(authorKey: string): string {
  return `${MAIN_ORIGIN}/about/${authorKey}#person`;
}

export function articleId(locale: Locale, slug: string): string {
  return `${BLOG_ORIGIN}/${locale}/blog/${slug}#article`;
}

export function articleUrl(locale: Locale, slug: string): string {
  return `${BLOG_ORIGIN}/${locale}/blog/${slug}`;
}

export function clusterUrl(locale: Locale, cluster: string): string {
  return `${BLOG_ORIGIN}/${locale}/cluster/${cluster}`;
}

export function authorUrl(locale: Locale, authorKey: string): string {
  return `${BLOG_ORIGIN}/${locale}/authors/${authorKey}`;
}

type IdRef = { "@id": string };

export interface OrganizationNode {
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo: { "@type": "ImageObject"; url: string };
  sameAs: string[];
  founder: IdRef;
  areaServed: Array<{ "@type": string; name: string }>;
}

export interface PersonNode {
  "@type": "Person";
  "@id": string;
  name: string;
  alternateName?: string;
  jobTitle: string;
  worksFor?: IdRef;
  affiliation?: IdRef;
  sameAs: string[];
}

export interface WebsiteNode {
  "@type": "WebSite";
  "@id": string;
  url: string;
  name: string;
  publisher: IdRef;
  inLanguage: Locale[];
}

export interface BlogPostingNode {
  "@type": "BlogPosting";
  "@id": string;
  headline: string;
  description: string;
  url: string;
  author: IdRef;
  publisher: IdRef;
  isPartOf: IdRef;
  datePublished: string;
  dateModified: string;
  keywords: string[];
  inLanguage: Locale;
  image: string;
}

export interface BreadcrumbListNode {
  "@type": "BreadcrumbList";
  itemListElement: Array<{ "@type": "ListItem"; position: number; name: string; item: string }>;
}

export type JsonLdNode = OrganizationNode | PersonNode | WebsiteNode | BlogPostingNode | BreadcrumbListNode;

export interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

// claude.md gives only this one sameAs URL as a real, confirmed value — the
// Clutch/Crunchbase/LinkedIn entries in the spec are literal "..." placeholders.
// Do not invent URLs here; add real ones when they exist.
const ORGANIZATION_SAME_AS = ["https://www.wikidata.org/wiki/Q140288424"];

export function buildOrganizationNode(): OrganizationNode {
  const founder = listAuthors().find((author) => author.isFounder);
  if (!founder) {
    throw new Error("lib/authors.ts has no author with isFounder: true — Organization.founder cannot be resolved");
  }

  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "AI Solution",
    url: MAIN_ORIGIN,
    logo: { "@type": "ImageObject", url: `${MAIN_ORIGIN}/logo.png` },
    sameAs: ORGANIZATION_SAME_AS,
    founder: { "@id": personId(founder.key) },
    areaServed: [
      { "@type": "Country", name: "Uzbekistan" },
      { "@type": "Place", name: "Central Asia" }
    ]
  };
}

export function buildPersonNode(author: Author): PersonNode {
  return {
    "@type": "Person",
    "@id": personId(author.key),
    name: author.name.ru,
    alternateName: author.alternateName,
    jobTitle: author.role.ru,
    worksFor: author.isFounder ? { "@id": ORGANIZATION_ID } : undefined,
    affiliation: author.isFounder ? undefined : { "@id": ORGANIZATION_ID },
    sameAs: author.sameAs
  };
}

export function buildWebsiteNode(): WebsiteNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BLOG_ORIGIN,
    name: "AI Solution Blog",
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: [...locales]
  };
}

export function buildBlogPostingNode(post: Post): BlogPostingNode {
  return {
    "@type": "BlogPosting",
    "@id": articleId(post.lang, post.slug),
    headline: post.title,
    description: post.description,
    url: articleUrl(post.lang, post.slug),
    author: { "@id": personId(post.author) },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    keywords: post.keywords,
    inLanguage: post.lang,
    image: post.cover.startsWith("http") ? post.cover : `${BLOG_ORIGIN}${post.cover}`
  };
}

export function buildArticleBreadcrumbList(post: Post): BreadcrumbListNode {
  const base = `${BLOG_ORIGIN}/${post.lang}`;
  const cluster = clusterMeta[post.topicCluster].title[post.lang];
  const blogLabel = post.lang === "ru" ? "Блог" : "Blog";

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: blogLabel, item: base },
      { "@type": "ListItem", position: 2, name: cluster, item: clusterUrl(post.lang, post.topicCluster) },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl(post.lang, post.slug) }
    ]
  };
}

/**
 * Full @graph for a single article page. Always includes the founder's
 * Person node (Organization.founder points at it) plus the actual author's
 * Person node when a student wrote the piece, so no @id in the graph
 * dangles without a matching node — see findDanglingReferences below.
 */
export function buildArticleGraph(post: Post): JsonLdGraph {
  const founder = listAuthors().find((author) => author.isFounder);
  if (!founder) {
    throw new Error("lib/authors.ts has no author with isFounder: true");
  }
  const author = resolveAuthor(post.author);

  const personNodes = [buildPersonNode(founder)];
  if (author.key !== founder.key) {
    personNodes.push(buildPersonNode(author));
  }

  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationNode(), ...personNodes, buildWebsiteNode(), buildBlogPostingNode(post), buildArticleBreadcrumbList(post)]
  };
}

/** @graph for the locale home page and cluster hub pages: no single article, no breadcrumb. */
export function buildWebsiteGraph(): JsonLdGraph {
  const founder = listAuthors().find((author) => author.isFounder);
  if (!founder) {
    throw new Error("lib/authors.ts has no author with isFounder: true");
  }

  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationNode(), buildPersonNode(founder), buildWebsiteNode()]
  };
}

/** @graph for an /authors/[author] profile page. */
export function buildAuthorGraph(authorKey: string): JsonLdGraph {
  const author = resolveAuthor(authorKey);
  const founder = listAuthors().find((candidate) => candidate.isFounder);
  if (!founder) {
    throw new Error("lib/authors.ts has no author with isFounder: true");
  }

  const personNodes = [buildPersonNode(author)];
  if (author.key !== founder.key) {
    personNodes.push(buildPersonNode(founder));
  }

  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationNode(), ...personNodes]
  };
}

/**
 * Walks a graph's node bodies and returns every `{ "@id": "..." }` reference
 * that doesn't match an `@id` defined by one of the graph's own nodes.
 * Used to catch a broken author/publisher/isPartOf pointer before it ships.
 */
export function findDanglingReferences(graph: JsonLdGraph): string[] {
  const definedIds = new Set(
    graph["@graph"]
      .map((node) => ("@id" in node ? node["@id"] : undefined))
      .filter((id): id is string => typeof id === "string")
  );

  const referenced: string[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 1 && entries[0][0] === "@id" && typeof entries[0][1] === "string") {
        referenced.push(entries[0][1]);
        return;
      }
      entries.forEach(([, nested]) => visit(nested));
    }
  };

  graph["@graph"].forEach(visit);
  return referenced.filter((id) => !definedIds.has(id));
}
