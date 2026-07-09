import sharp from "sharp";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#d8ff2c"/>
  <path d="M19 44V20h8l8 9.5 8-9.5h8v24h-8V33l-8 9.5L27 33v11z" fill="#07070c"/>
  <path d="M16 16h32v32H16z" fill="none" stroke="#07070c" stroke-width="3" stroke-linejoin="round"/>
</svg>
`;

export async function GET() {
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
