import sharp from "sharp";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1c46d6"/>
  <path d="M14 50V14h9.2l8.8 10.5 8.8-10.5H50v36h-8.2V27.8l-9 10.7-9-10.7V50H14Z" fill="#07070c"/>
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
