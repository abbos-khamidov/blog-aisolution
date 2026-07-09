import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "./i18n";
import { isKnownAuthor, resolveAuthor } from "./authors";
import { parseFrontmatter, topicClusters, type Frontmatter, type TopicCluster } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");
const WORDS_PER_MINUTE = 200;

export type Post = Frontmatter & {
  content: string;
  readMinutes: number;
};

export const clusterMeta: Record<TopicCluster, { title: Record<Locale, string>; description: Record<Locale, string> }> = {
  vnedrenie: {
    title: { ru: "Внедрение ИИ в бизнес", uz: "Biznesga AI joriy etish" },
    description: {
      ru: "Как компании в Узбекистане реально внедряют ИИ: шаги, ошибки, сроки.",
      uz: "O'zbekistondagi kompaniyalar AIni qanday joriy etyapti: qadamlar, xatolar, muddatlar."
    }
  },
  prodazhi: {
    title: { ru: "ИИ в продажах и CRM", uz: "Savdo va CRMda AI" },
    description: {
      ru: "Автоматизация продаж, аналитика лидов, контроль качества звонков и сделок.",
      uz: "Savdo avtomatlashtiruvi, lidlar analitikasi, qo'ng'iroq va bitimlar sifatini nazorat qilish."
    }
  },
  integratsii: {
    title: { ru: "Интеграции", uz: "Integratsiyalar" },
    description: {
      ru: "1С, Битрикс24, OnlinePBX и другие системы — как связать их с ИИ без хаоса.",
      uz: "1C, Bitrix24, OnlinePBX va boshqa tizimlar — ularni AI bilan tartibli bog'lash."
    }
  },
  "nlp-uz": {
    title: { ru: "Узбекский язык и NLP", uz: "O'zbek tili va NLP" },
    description: {
      ru: "Распознавание речи, NLP и работа ИИ с узбекским языком.",
      uz: "Nutqni tanish, NLP va AIning o'zbek tili bilan ishlashi."
    }
  },
  otrasli: {
    title: { ru: "Отраслевые кейсы", uz: "Soha keyslari" },
    description: {
      ru: "Стройка, ритейл, ювелирка и другие отрасли: что в них меняет ИИ.",
      uz: "Qurilish, chakana savdo, zargarlik va boshqa sohalar: AI ularda nimani o'zgartiryapti."
    }
  },
  ekonomika: {
    title: { ru: "Экономика ИИ", uz: "AI iqtisodiyoti" },
    description: {
      ru: "Стоимость, ROI и реальные сроки окупаемости внедрения ИИ.",
      uz: "AI joriy etish narxi, ROI va real qoplanish muddatlari."
    }
  },
  obuchenie: {
    title: { ru: "Обучение и кадры", uz: "O'qitish va kadrlar" },
    description: {
      ru: "ML, обучение команд и то, как готовить кадры для ИИ-проектов.",
      uz: "ML, jamoalarni o'qitish va AI loyihalari uchun kadrlar tayyorlash."
    }
  },
  mnenie: {
    title: { ru: "Колонки и позиция", uz: "Sharhlar va pozitsiya" },
    description: {
      ru: "Личная позиция AI Solution по спорным и важным темам рынка ИИ.",
      uz: "AI bozoridagi muhim va bahsli mavzular bo'yicha AI Solution shaxsiy pozitsiyasi."
    }
  }
};

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readMdxFileNames(locale: Locale): string[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

function loadPost(locale: Locale, fileName: string): Post {
  const filePath = path.join(CONTENT_DIR, locale, fileName);
  const relativeName = `content/${locale}/${fileName}`;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const frontmatter = parseFrontmatter(relativeName, data);

  if (frontmatter.lang !== locale) {
    throw new Error(`${relativeName}: frontmatter.lang ("${frontmatter.lang}") doesn't match its folder ("${locale}")`);
  }

  const expectedSlug = fileName.replace(/\.mdx$/, "");
  if (frontmatter.slug !== expectedSlug) {
    throw new Error(`${relativeName}: frontmatter.slug ("${frontmatter.slug}") doesn't match the file name ("${expectedSlug}.mdx")`);
  }

  if (!isKnownAuthor(frontmatter.author)) {
    // Throws UnknownAuthorError with the file name context lost otherwise —
    // re-wrap so a bad byline still points back at the offending file.
    try {
      resolveAuthor(frontmatter.author);
    } catch (error) {
      throw new Error(`${relativeName}: ${(error as Error).message}`);
    }
  }

  return {
    ...frontmatter,
    content: content.trim(),
    readMinutes: estimateReadMinutes(content)
  };
}

function loadAllPosts(): Post[] {
  return locales.flatMap((locale) => readMdxFileNames(locale).map((fileName) => loadPost(locale, fileName)));
}

export function getAllPosts(): Post[] {
  return loadAllPosts();
}

export function getPublishedPosts(locale?: Locale): Post[] {
  return loadAllPosts()
    .filter((post) => !post.draft)
    .filter((post) => (locale ? post.lang === locale : true))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return getPublishedPosts(locale).find((post) => post.slug === slug);
}

export function getPostsByCluster(
  locale: Locale,
  cluster: TopicCluster,
  options: { excludeSlug?: string; limit?: number } = {}
): Post[] {
  const posts = getPublishedPosts(locale).filter(
    (post) => post.topicCluster === cluster && post.slug !== options.excludeSlug
  );
  return typeof options.limit === "number" ? posts.slice(0, options.limit) : posts;
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  return getPostsByCluster(post.lang, post.topicCluster, { excludeSlug: post.slug, limit });
}

export function getTranslation(post: Post): Post | undefined {
  if (!post.translationOf) return undefined;
  const otherLocale = locales.find((locale) => locale !== post.lang);
  if (!otherLocale) return undefined;
  return getPublishedPosts(otherLocale).find(
    (candidate) => candidate.slug === post.translationOf || candidate.translationOf === post.slug
  );
}

export function getPostsByAuthor(authorKey: string, locale?: Locale): Post[] {
  return getPublishedPosts(locale).filter((post) => post.author === authorKey);
}

export function getClustersInUse(locale?: Locale): TopicCluster[] {
  const used = new Set(getPublishedPosts(locale).map((post) => post.topicCluster));
  return topicClusters.filter((cluster) => used.has(cluster));
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}
