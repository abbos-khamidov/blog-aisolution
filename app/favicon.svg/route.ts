import path from "node:path";
import { readFile } from "node:fs/promises";

export async function GET() {
  const png = await readFile(path.join(process.cwd(), "public/brand/site-mark-round.png"));
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" ry="18" fill="#1c46d6" />
  <image href="data:image/png;base64,${png.toString("base64")}" x="0" y="0" width="64" height="64" />
</svg>
`;

  return new Response(svg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}
