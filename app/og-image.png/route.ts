import path from "node:path";
import { readFile } from "node:fs/promises";

export async function GET() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/site-mark.png"));
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d8ff2b"/>
      <stop offset="100%" stop-color="#b9f71f"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#07070c" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1030" cy="115" r="126" fill="#07070c" opacity="0.06"/>
  <circle cx="180" cy="540" r="190" fill="#07070c" opacity="0.05"/>
  <rect x="88" y="88" width="1024" height="454" rx="36" ry="36" fill="#f8f1de" stroke="#07070c" stroke-width="8" filter="url(#shadow)"/>
  <rect x="132" y="132" width="88" height="88" rx="22" ry="22" fill="#d8ff2b" stroke="#07070c" stroke-width="5"/>
  <image href="data:image/png;base64,${logo.toString("base64")}" x="143" y="143" width="66" height="66" />
  <text x="248" y="178" fill="#07070c" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="900" letter-spacing="0.5">AISOLUTION BLOG</text>
  <text x="248" y="228" fill="#ff5b1f" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="1.4">STARTUP VERDICTS</text>
  <text x="132" y="342" fill="#07070c" font-family="Inter, Arial, sans-serif" font-size="66" font-weight="900">Оцениваем стартапы</text>
  <text x="132" y="410" fill="#07070c" font-family="Inter, Arial, sans-serif" font-size="66" font-weight="900">без реверансов</text>
  <text x="132" y="484" fill="#3f3f49" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">Бизнес, рынок, команда и цифры. Без шума.</text>
</svg>
`;

  const png = await import("sharp").then(({ default: sharp }) =>
    sharp(Buffer.from(svg))
      .png()
      .toBuffer()
  );

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}
