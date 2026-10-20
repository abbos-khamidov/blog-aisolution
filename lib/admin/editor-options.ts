import fs from "node:fs";
import path from "node:path";
import { listAuthors } from "../authors";
import { clusterMeta } from "../post-display";
import { postCategories, topicClusters } from "../schema";

export type EditorOptions = {
  authors: { key: string; name: string }[];
  clusters: { key: string; name: string }[];
  categories: string[];
  covers: string[];
};

export function getEditorOptions(): EditorOptions {
  const coversDir = path.join(process.cwd(), "public", "covers");
  const covers = fs.existsSync(coversDir) ? fs.readdirSync(coversDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => `/covers/${f}`) : [];
  return {
    authors: listAuthors().map((a) => ({ key: a.key, name: a.name.uz })),
    clusters: topicClusters.map((key) => ({ key, name: clusterMeta[key].title.uz })),
    categories: [...postCategories],
    covers
  };
}
