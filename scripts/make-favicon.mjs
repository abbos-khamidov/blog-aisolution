/**
 * Favicons in the blog's own colours: the AI Solution hexagon mark in black on
 * a full lime (#D8FF2C) square, inside the circle Google crops to, large enough
 * to read at 16px. Sizes Google and browsers ask for:
 *   public/brand/favicon-48.png, favicon-96.png, favicon-192.png  (Google: multiple of 48px)
 *   public/brand/apple-touch-icon.png                              (iOS: 180×180, no transparency)
 *   app/icon.svg                                                    (same mark for SVG-only clients)
 * /favicon.ico and /favicon.svg are built from favicon-48.png / favicon-192.png at deploy.
 *
 * Run after the logo changes:  npm run favicon:make
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "brand", "logo-light-transparent.png");
const OUT = path.join(ROOT, "public", "brand");
const SIZE = 512;
const MARK = Math.round(SIZE * 0.62);
const LIME = "#D8FF2C";
const INK = { r: 11, g: 11, b: 15 };

// Logo shape (alpha) from the master file, filled with the site's ink colour.
const shape = await sharp(SOURCE).trim().resize(MARK, MARK, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const alpha = await sharp(shape).extractChannel("alpha").toBuffer();
const mark = await sharp({ create: { width: MARK, height: MARK, channels: 3, background: INK } }).joinChannel(alpha).png().toBuffer();
const offset = Math.round((SIZE - MARK) / 2);

const square = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: LIME } })
  .composite([{ input: mark, left: offset, top: offset }])
  .png()
  .toBuffer();

// Google wants a square icon and crops it to a circle itself; a full-bleed square
// (no transparent corners) looks the same on light and dark result pages.
for (const size of [48, 96, 192]) {
  await sharp(square).resize(size, size).flatten({ background: LIME }).png({ compressionLevel: 9 }).toFile(path.join(OUT, `favicon-${size}.png`));
}
await sharp(square).resize(180, 180).flatten({ background: LIME }).png({ compressionLevel: 9 }).toFile(path.join(OUT, "apple-touch-icon.png"));

const embedded = (await sharp(square).resize(192, 192).png({ compressionLevel: 9 }).toBuffer()).toString("base64");
fs.writeFileSync(
  path.join(ROOT, "app", "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n  <image href="data:image/png;base64,${embedded}" x="0" y="0" width="64" height="64" />\n</svg>\n`
);
console.log("favicons written to public/brand and app/icon.svg");
