import { z } from "zod";
import { locales } from "./i18n";

/**
 * Content pillars a post can belong to. Drives cluster hub pages and
 * "ещё по теме" internal linking — see claude.md, задача 5.
 */
export const topicClusters = [
  "vnedrenie",
  "prodazhi",
  "integratsii",
  "nlp-uz",
  "otrasli",
  "ekonomika",
  "obuchenie",
  "mnenie"
] as const;

export type TopicCluster = (typeof topicClusters)[number];

/**
 * Editorial filter for the homepage feed pills — separate from
 * topicCluster (which is a content-pillar taxonomy almost everything
 * currently sits under "mnenie" for). Optional: pieces that are neither a
 * startup review nor a product review (macro, regulation, geopolitics)
 * just omit it and only show up under "Все".
 */
export const postCategories = ["startup", "product"] as const;

export type PostCategory = (typeof postCategories)[number];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugField = z
  .string()
  .regex(slugPattern, "must be kebab-case: lowercase letters, digits, single hyphens (e.g. vnedrenie-ii-otdel-prodazh)");

function isValidCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() + 1 === Number(m) &&
    date.getUTCDate() === Number(d)
  );
}

const isoDateField = z
  .string()
  .refine(isValidCalendarDate, "must be a real calendar date in YYYY-MM-DD format");

const publicPathField = z
  .string()
  .startsWith("/", "must be a path starting with / (relative to /public or aisolution.uz)");

export const frontmatterSchema = z
  .object({
    title: z
      .string()
      .min(20, "must be at least 20 characters (used verbatim in <title> / og:title)")
      .max(70, "must be at most 70 characters (used verbatim in <title> / og:title)"),
    description: z
      .string()
      .min(70, "must be 70–160 characters (used verbatim in meta description)")
      .max(160, "must be 70–160 characters (used verbatim in meta description)"),
    slug: slugField,
    lang: z.enum(locales),
    publishedAt: isoDateField,
    updatedAt: isoDateField.optional(),
    author: z.string().min(1, "must reference an author key from lib/authors.ts"),
    topicCluster: z.enum(topicClusters),
    category: z.enum(postCategories).optional(),
    keywords: z
      .array(z.string().min(1))
      .min(1, "at least 1 keyword required")
      .max(8, "at most 8 keywords allowed"),
    rating: z
      .number()
      .min(1, "must be a real editorial score 1–10, not a placeholder default")
      .max(10, "must be a real editorial score 1–10, not a placeholder default"),
    serviceLink: publicPathField.optional(),
    translationOf: slugField.optional(),
    cover: publicPathField,
    coverLabel: z.string().min(2).max(28).optional(),
    coverLogo: publicPathField.optional(),
    draft: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    if (data.translationOf && data.translationOf === data.slug) {
      ctx.addIssue({
        code: "custom",
        path: ["translationOf"],
        message: "cannot reference its own slug"
      });
    }
    if (data.updatedAt && data.updatedAt < data.publishedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "cannot be earlier than publishedAt"
      });
    }
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export class FrontmatterValidationError extends Error {
  constructor(fileName: string, issues: z.core.$ZodIssue[]) {
    const details = issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    super(`Invalid frontmatter in ${fileName}:\n${details}`);
    this.name = "FrontmatterValidationError";
  }
}

/**
 * Throws FrontmatterValidationError (with file name + readable issue list) on
 * invalid input so a bad post fails the Next.js build instead of shipping
 * broken schema.org data. Called from lib/content.ts for every MDX file.
 */
export function parseFrontmatter(fileName: string, raw: unknown): Frontmatter {
  const result = frontmatterSchema.safeParse(raw);
  if (!result.success) {
    throw new FrontmatterValidationError(fileName, result.error.issues);
  }
  return result.data;
}
