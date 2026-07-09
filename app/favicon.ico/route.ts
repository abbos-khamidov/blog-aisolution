import sharp from "sharp";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#d8ff2c"/>
  <path d="M19 44V20h8l8 9.5 8-9.5h8v24h-8V33l-8 9.5L27 33v11z" fill="#07070c"/>
  <path d="M16 16h32v32H16z" fill="none" stroke="#07070c" stroke-width="3" stroke-linejoin="round"/>
</svg>
`;

export async function GET() {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
