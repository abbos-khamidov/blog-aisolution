import path from "node:path";

/**
 * Where runtime data (admin posts) is stored — must survive deploys.
 *
 * In production the site runs from `.next/standalone/server.js`, which does
 * `process.chdir(__dirname)`, so process.cwd() is `<app>/.next/standalone`.
 * `next build` wipes `.next/` on every deploy, so data written there would be
 * lost. In that case we step back out to `<app>/data` (git-ignored, untouched
 * by `npm ci`, `next build` and `git pull`).
 *
 * ADMIN_DATA_DIR in the environment overrides everything (absolute path).
 */
export function resolveDataDir(cwd: string = process.cwd(), env: Record<string, string | undefined> = process.env): string {
  if (env.ADMIN_DATA_DIR?.trim()) return path.resolve(env.ADMIN_DATA_DIR.trim());
  const isStandalone = path.basename(cwd) === "standalone" && path.basename(path.dirname(cwd)) === ".next";
  return isStandalone ? path.resolve(cwd, "..", "..", "data") : path.join(cwd, "data");
}
