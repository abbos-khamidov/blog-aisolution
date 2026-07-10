export async function GET() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1c46d6" />
  <image href="/brand/site-mark.png" x="0" y="0" width="64" height="64" />
</svg>
`;

  return new Response(svg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}
