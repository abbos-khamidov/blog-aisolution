import sharp from "sharp";

export async function GET() {
  const png = await sharp("public/brand/site-mark.png")
    .resize(32, 32)
    .png()
    .toBuffer();
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
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}
