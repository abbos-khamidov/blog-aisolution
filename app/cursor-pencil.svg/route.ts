export async function GET() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <g transform="translate(2 2) rotate(-32 14 14)">
    <path d="M4 19L19 4H25C27.2 4 29 5.8 29 8V14L14 29H8C5.8 29 4 27.2 4 25V19Z" fill="#FFF3DA" stroke="#07070c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M19 4H24.2C26.3 4 28 5.7 28 7.8V12.2L24 16.2L19 11.2V4Z" fill="#d8ff2c" stroke="#07070c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M6.2 22.8L9.4 26L5.2 27L6.2 22.8Z" fill="#07070c"/>
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
