import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function GET() {
  const logoPath = path.join(process.cwd(), "public", "brand", "logo-dark-transparent.png");
  const logo = await fs.readFile(logoPath);
  const dataUri = `data:image/png;base64,${logo.toString("base64")}`;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1c46d6"/>
  <image href="${dataUri}" x="11" y="11" width="42" height="42" style="filter: brightness(0) saturate(100%);" />
</svg>
`;
  const png = await sharp(Buffer.from(svg)).png().resize(32, 32).toBuffer();
  const header = Buffer.alloc(6 + 16);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);

  const ico = new Uint8Array(header.length + png.length);
  ico.set(header, 0);
  ico.set(png, header.length);

  return new Response(ico, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
