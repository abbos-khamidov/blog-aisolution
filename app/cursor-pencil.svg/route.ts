export async function GET() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <g transform="translate(2 2) rotate(-35 14 14)">
    <path d="M4 18L18 4L26 12L12 26H4V18Z" fill="#FFF8E8" stroke="#07070c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18 4L22 0L30 8L26 12L18 4Z" fill="#d8ff2c" stroke="#07070c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M8 22L5 27L10 24" fill="#07070c"/>
  </g>
</svg>
`;

  return new Response(svg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
