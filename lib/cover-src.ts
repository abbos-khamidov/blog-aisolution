import { OPTIMIZED_COVERS } from "./cover-variants.generated";

export type CoverWidth = 640 | 1280;

/**
 * Light WebP version of a cover for the given display width, or the original
 * file when no optimized copy exists (e.g. a cover added without running
 * `npm run covers:optimize`). Client-safe: no fs access.
 */
export function coverSrc(cover: string, width: CoverWidth): string {
  const match = /^\/covers\/([A-Za-z0-9._-]+)\.(png|jpe?g)$/i.exec(cover);
  if (!match || !OPTIMIZED_COVERS.has(match[1])) return cover;
  return `/covers/opt/${match[1]}-${width}.webp`;
}
