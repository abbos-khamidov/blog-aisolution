import fs from "node:fs";
import path from "node:path";
import { getPublishedPosts } from "../lib/content";
import { locales } from "../lib/i18n";
import { sendPushToLocale } from "../lib/push";

// This script runs standalone via `tsx`, outside Next.js's built-in env
// loading, so .env.local / .env need to be read manually here.
function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const CURSOR_FILE = path.join(process.cwd(), "data", "last-notified.json");
const SITE_URL = process.env.SITE_URL || "https://blog.aisolution.uz";

function readCursor(): Record<string, string> {
  if (!fs.existsSync(CURSOR_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CURSOR_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCursor(cursor: Record<string, string>) {
  fs.mkdirSync(path.dirname(CURSOR_FILE), { recursive: true });
  fs.writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2));
}

async function main() {
  const cursor = readCursor();

  for (const locale of locales) {
    const posts = getPublishedPosts(locale)
      .slice()
      .sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : 1));

    if (posts.length === 0) continue;

    const lastIndex = posts.findIndex((post) => post.slug === cursor[locale]);
    // First run ever (no cursor): notify only the latest post, not the whole backlog.
    const newPosts = lastIndex === -1 ? posts.slice(-1) : posts.slice(lastIndex + 1);

    for (const post of newPosts) {
      const result = await sendPushToLocale(locale, {
        title: post.title,
        body: post.description,
        url: `${SITE_URL}/${locale}/blog/${post.slug}`
      });
      console.log(`[notify] ${locale}/${post.slug} -> sent ${result.sent}, removed ${result.removed}`);
    }

    cursor[locale] = posts[posts.length - 1].slug;
  }

  writeCursor(cursor);
}

main().catch((error) => {
  console.error("[notify] failed:", error);
  process.exit(1);
});
