import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { listAuthors } from "../lib/authors";
import { parseFrontmatter, postCategories, topicClusters, type PostCategory, type TopicCluster } from "../lib/schema";
import { locales, type Locale } from "../lib/i18n";

const CONTENT_DIR = path.join(process.cwd(), "content");

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

function slugify(title: string): string {
  const transliterated = title
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function uniqueSlug(lang: Locale, baseSlug: string): string {
  let slug = baseSlug;
  let attempt = 2;
  while (fs.existsSync(path.join(CONTENT_DIR, lang, `${slug}.mdx`))) {
    slug = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
  return slug;
}

type Asker = (prompt: string) => Promise<string>;

/**
 * Sequential rl.question() calls silently drop lines when stdin is piped
 * (non-TTY) instead of typed live — the "line" event fires before the next
 * question's listener is attached. Pulling from one shared async iterator
 * over the interface avoids that race and works for both a real terminal
 * and piped/non-interactive input.
 */
function createAsker(rl: readline.Interface): Asker {
  const lines = rl[Symbol.asyncIterator]();
  return async (prompt: string) => {
    process.stdout.write(prompt);
    const { value, done } = await lines.next();
    if (done || value === undefined) {
      throw new Error("Ввод прервался раньше времени.");
    }
    return value.trim();
  };
}

async function pickFromList<T extends string>(ask: Asker, label: string, options: readonly T[]): Promise<T> {
  console.log(`\n${label}`);
  options.forEach((option, index) => console.log(`  ${index + 1}. ${option}`));
  while (true) {
    const raw = await ask("Номер: ");
    const index = Number(raw) - 1;
    if (Number.isInteger(index) && index >= 0 && index < options.length) {
      return options[index];
    }
    console.log("Некорректный номер, попробуй ещё раз.");
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  const ask = createAsker(rl);

  try {
    console.log("Скаффолд новой статьи для blog.aisolution.uz\n");

    const lang = await pickFromList(ask, "Язык:", locales);

    const title = await ask("Заголовок (20–70 символов): ");
    const description = await ask("Описание для SEO (70–160 символов): ");
    const keywordsRaw = await ask("Ключевые слова через запятую (1–8): ");
    const keywords = keywordsRaw.split(",").map((kw) => kw.trim()).filter(Boolean);

    const authors = listAuthors();
    if (authors.length === 0) {
      throw new Error("lib/authors.ts пуст — сначала добавь хотя бы одного автора.");
    }
    const authorLabels = authors.map((author) => `${author.key} (${author.name.ru})`);
    const authorChoice = await pickFromList(ask, "Автор:", authorLabels);
    const author = authors[authorLabels.indexOf(authorChoice)].key;

    const topicCluster = await pickFromList<TopicCluster>(ask, "Тематический кластер:", topicClusters);

    // Optional: only feeds the "Стартапы"/"Продукты" filter pills on the
    // homepage feed. Пропусти, если материал не обзор конкретной компании
    // или конкретного продукта (макро, регуляторка, геополитика и т.п.).
    const categoryChoices = ["(нет)", ...postCategories] as const;
    const categoryChoice = await pickFromList(ask, "Категория для фильтра (Стартап/Продукт), необязательно:", categoryChoices);
    const category = categoryChoice === "(нет)" ? undefined : (categoryChoice as PostCategory);

    const baseSlug = slugify(title);
    if (!baseSlug) {
      throw new Error("Не удалось построить slug из заголовка — введи заголовок словами на русском или узбекском.");
    }
    const slug = uniqueSlug(lang, baseSlug);

    const frontmatter = {
      title,
      description,
      slug,
      lang,
      publishedAt: new Date().toISOString().slice(0, 10),
      author,
      topicCluster,
      category,
      keywords,
      cover: "/images/aisolution-blog-hero.png",
      draft: true
    };

    // Fail loudly here (before writing anything) instead of letting the
    // student discover a broken frontmatter only when `npm run build` fails.
    parseFrontmatter(`content/${lang}/${slug}.mdx`, frontmatter);

    const dir = path.join(CONTENT_DIR, lang);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.mdx`);

    const yaml = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `slug: "${slug}"`,
      `lang: "${lang}"`,
      `publishedAt: "${frontmatter.publishedAt}"`,
      `author: "${author}"`,
      `topicCluster: "${topicCluster}"`,
      ...(category ? [`category: "${category}"`] : []),
      `keywords: [${keywords.map((kw) => `"${kw}"`).join(", ")}]`,
      `cover: "${frontmatter.cover}"`,
      "draft: true",
      "---",
      "",
      "Тезис: сформулируй позицию AI Solution по теме в первом абзаце.",
      "",
      "Аргумент: почему это так — раскрой логику тезиса.",
      "",
      "Пример из практики: конкретная иллюстрация без цифр клиентских проектов без согласования с founder.",
      "",
      "Вывод: что из этого следует для читателя.",
      ""
    ].join("\n");

    fs.writeFileSync(filePath, yaml, "utf8");
    console.log(`\nГотово: content/${lang}/${slug}.mdx (draft: true)`);
    console.log("Правь текст, затем draft: false и npm run build перед PR.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`\nОшибка: ${(error as Error).message}`);
  process.exit(1);
});
