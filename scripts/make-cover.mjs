/**
 * Branded article covers in the AI Solution style: graphite background with a
 * violet glow (top right) and a lime glow (bottom left), a small mono label,
 * a big title, one subtitle line and a line-art icon on the right.
 *
 *   npm run covers:make              # every cover listed in scripts/cover-specs.mjs
 *   npm run covers:make -- repli     # only specs whose file name contains "repli"
 *
 * Output: public/covers/<file>.png (1200×630, also used as og:image).
 * Also rewrites lib/cover-branded.generated.ts (covers that need no label pill).
 * Run `npm run covers:optimize` afterwards to refresh the WebP copies.
 *
 * Fonts: Inter (ExtraBold + Regular) and JetBrains Mono must be installed on
 * the machine. Both are free (OFL): https://rsms.me/inter, https://www.jetbrains.com/lp/mono/
 * Without them the system falls back to another font and the covers look different.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { coverSpecs, eyebrows } from "./cover-specs.mjs";

const W = 1200;
const H = 630;
const LIME = "#D8FF2C";
const VIOLET = "#8E7BFF";
const LEFT = 76;
const TITLE_MAX_WIDTH = 640;

/** Outline of a cog wheel with `teeth` teeth (outer radius r1, inner r2). */
function gearPath(cx, cy, r1, r2, teeth) {
  const points = [];
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (Math.PI * 2 * i) / (teeth * 4);
    const r = i % 4 < 2 ? r1 : r2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)} ${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${points.join(" L")} Z`;
}

// Line-art icons drawn in a 200×200 box. "a" = lime stroke, "b" = violet stroke.
const a = `stroke="${LIME}"`;
const b = `stroke="${VIOLET}"`;
const icons = {
  shield: `<path ${a} d="M100 18 L166 42 V96 C166 140 138 168 100 184 C62 168 34 140 34 96 V42 Z"/>
    <rect ${a} x="76" y="92" width="48" height="40" rx="6"/><path ${a} d="M84 92 V78 a16 16 0 0 1 32 0 V92"/><circle cx="100" cy="112" r="4" fill="${LIME}" stroke="none"/>`,
  chat: `<rect ${a} x="18" y="34" width="112" height="70" rx="10"/><path ${a} d="M44 104 L40 124 L64 104"/>
    <rect ${b} x="70" y="84" width="112" height="70" rx="10"/><path ${b} d="M156 154 L162 174 L136 154"/>`,
  bars: `<rect ${a} x="34" y="112" width="28" height="64"/><rect ${a} x="80" y="84" width="28" height="92"/><rect ${b} x="126" y="48" width="28" height="128"/>
    <path ${a} d="M30 78 L110 36 L170 22"/><path ${a} d="M152 16 L172 22 L160 38"/>`,
  candles: `<path ${a} d="M16 160 L64 110 L100 132 L140 74 L188 40"/>
    <path ${b} d="M64 70 V150 M100 96 V172 M140 40 V116"/>
    <rect ${b} x="56" y="90" width="16" height="40" rx="2"/><rect ${a} x="92" y="114" width="16" height="36" rx="2"/><rect ${b} x="132" y="58" width="16" height="40" rx="2"/>`,
  nodes: `<path ${a} d="M50 50 L130 40 L170 120 L110 160 L40 110 Z M130 40 L110 160"/>
    <circle ${a} cx="50" cy="50" r="10" fill="#0d0d12"/><circle ${a} cx="130" cy="40" r="10" fill="#0d0d12"/><circle ${a} cx="170" cy="120" r="10" fill="#0d0d12"/>
    <circle ${b} cx="110" cy="160" r="10" fill="#0d0d12"/><circle ${a} cx="40" cy="110" r="10" fill="#0d0d12"/>`,
  bbox: `<rect ${a} x="24" y="34" width="104" height="72"/><rect ${b} x="102" y="90" width="76" height="62"/><rect ${a} x="70" y="124" width="58" height="46"/>
    <text x="24" y="26" fill="${LIME}" stroke="none" font-family="JetBrains Mono" font-size="12">object 0.96</text>`,
  cap: `<path ${a} d="M100 40 L182 78 L100 116 L18 78 Z"/><path ${b} d="M50 94 V138 C70 158 130 158 150 138 V94"/><path ${a} d="M170 84 V140"/><circle cx="170" cy="146" r="6" fill="${LIME}" stroke="none"/>`,
  funnel: `<path ${a} d="M24 36 H176 L118 104 V160 L82 176 V104 Z"/><path ${b} d="M50 66 H150"/><circle cx="100" cy="20" r="6" fill="${VIOLET}" stroke="none"/><circle cx="70" cy="14" r="5" fill="${LIME}" stroke="none"/><circle cx="130" cy="12" r="5" fill="${LIME}" stroke="none"/>`,
  contacts: `<rect ${a} x="22" y="40" width="156" height="120" rx="10"/><circle ${b} cx="64" cy="90" r="18"/><path ${b} d="M36 138 C42 116 86 116 92 138"/>
    <path ${a} d="M112 80 H158 M112 102 H158 M112 124 H140"/>`,
  gear: `<path ${a} d="${gearPath(80, 104, 50, 38, 9)}"/><circle ${a} cx="80" cy="104" r="16"/>
    <rect ${b} x="136" y="24" width="48" height="34" rx="4"/><rect ${b} x="140" y="148" width="44" height="30" rx="4"/><path ${b} d="M126 70 L140 58 M126 140 L140 152"/>`,
  radar: `<circle ${a} cx="100" cy="100" r="78"/><circle ${b} cx="100" cy="100" r="50"/><circle ${a} cx="100" cy="100" r="22"/>
    <path ${a} d="M100 100 L156 46"/><circle cx="140" cy="132" r="6" fill="${VIOLET}" stroke="none"/><circle cx="62" cy="64" r="5" fill="${LIME}" stroke="none"/>`,
  route: `<path ${a} d="M30 168 C30 110 90 130 100 90 C110 50 170 70 170 30" stroke-dasharray="10 10"/>
    <circle ${b} cx="30" cy="168" r="12"/><circle ${a} cx="100" cy="92" r="9"/><path ${b} d="M170 50 C150 30 150 12 170 8 C190 12 190 30 170 50 Z"/>`,
  rings: `<circle ${a} cx="74" cy="100" r="50"/><circle ${b} cx="126" cy="100" r="50"/><path ${a} d="M100 58 V142"/>`,
  spark: `<path ${a} d="M86 26 C92 70 104 82 148 88 C104 94 92 106 86 150 C80 106 68 94 24 88 C68 82 80 70 86 26 Z"/>
    <path ${b} d="M152 120 C155 140 160 145 180 148 C160 151 155 156 152 176 C149 156 144 151 124 148 C144 145 149 140 152 120 Z"/>`,
  cursor: `<rect ${b} x="18" y="54" width="132" height="54" rx="27"/><path ${a} d="M44 81 H120"/>
    <path ${a} d="M120 104 L120 176 L138 158 L152 186 L164 180 L150 152 L174 150 Z"/>`,
  layers: `<path ${a} d="M100 30 L180 70 L100 110 L20 70 Z"/><path ${b} d="M20 104 L100 144 L180 104"/><path ${a} d="M20 138 L100 178 L180 138"/>`,
  quote: `<path ${a} d="M30 34 H170 a12 12 0 0 1 12 12 V122 a12 12 0 0 1 -12 12 H86 L52 166 V134 H30 a12 12 0 0 1 -12 -12 V46 a12 12 0 0 1 12 -12 Z"/>
    <path ${b} d="M74 66 C62 74 58 84 60 100 M74 100 a6 6 0 1 1 -12 0 M116 66 C104 74 100 84 102 100 M116 100 a6 6 0 1 1 -12 0"/><path ${b} d="M136 76 H160 M136 96 H152"/>`,
  flow: `<rect ${a} x="14" y="76" width="46" height="46" rx="6"/><rect ${b} x="78" y="76" width="46" height="46" rx="6"/><rect ${a} x="142" y="76" width="46" height="46" rx="6"/>
    <path ${a} d="M60 99 H76 M124 99 H140"/><path ${b} d="M37 76 V40 H165 V72"/><path ${b} d="M157 64 L165 74 L173 64"/>`,
  factory: `<path ${a} d="M20 176 V96 L64 120 V96 L108 120 V60 H140 V176 Z"/><path ${b} d="M150 176 V30 H180 V176"/><path ${a} d="M14 176 H190"/>
    <rect ${b} x="40" y="140" width="18" height="18"/><rect ${b} x="84" y="140" width="18" height="18"/>`,
  checklist: `<rect ${a} x="38" y="22" width="124" height="160" rx="10"/><path ${b} d="M58 64 L68 74 L86 54 M58 104 L68 114 L86 94 M58 144 L68 154 L86 134"/>
    <path ${a} d="M100 66 H140 M100 106 H140 M100 146 H128"/>`,
  orbit: `<ellipse ${a} cx="100" cy="100" rx="84" ry="36" transform="rotate(-24 100 100)"/><ellipse ${b} cx="100" cy="100" rx="84" ry="36" transform="rotate(36 100 100)"/>
    <circle cx="100" cy="100" r="14" fill="${LIME}" stroke="none"/>`,
  people: `<circle ${a} cx="70" cy="70" r="24"/><path ${a} d="M24 160 C28 118 112 118 116 160"/><circle ${b} cx="136" cy="62" r="20"/><path ${b} d="M118 104 C150 98 180 118 182 150"/>`,
  gauge: `<path ${a} d="M24 140 A76 76 0 0 1 176 140"/><path ${b} d="M42 140 A58 58 0 0 1 72 89"/><path ${a} d="M100 140 L148 84"/><circle ${a} cx="100" cy="140" r="9"/>
    <path ${a} d="M24 140 H40 M160 140 H176"/>`,
  slides: `<rect ${a} x="20" y="30" width="160" height="104" rx="6"/><path ${a} d="M100 134 V160 M70 182 L100 160 L130 182"/>
    <path ${b} d="M44 110 L80 76 L106 96 L152 54"/>`,
  trophy: `<path ${a} d="M64 26 H136 V82 C136 104 120 120 100 120 C80 120 64 104 64 82 Z"/><path ${b} d="M64 42 H32 C32 70 44 84 64 86 M136 42 H168 C168 70 156 84 136 86"/>
    <path ${a} d="M100 120 V150 M68 176 H132 L124 150 H76 Z"/>`,
  coins: `<ellipse ${a} cx="80" cy="56" rx="50" ry="16"/><path ${a} d="M30 56 V88 C30 97 52 104 80 104 C108 104 130 97 130 88 V56"/>
    <ellipse ${b} cx="122" cy="120" rx="50" ry="16"/><path ${b} d="M72 120 V152 C72 161 94 168 122 168 C150 168 172 161 172 152 V120"/>`,
  code: `<path ${a} d="M66 52 L22 100 L66 148 M134 52 L178 100 L134 148"/><path ${b} d="M114 34 L86 166"/>`,
  scales: `<path ${a} d="M100 26 V172 M60 172 H140 M36 54 H164"/><path ${b} d="M36 54 L14 112 H58 Z M164 54 L142 112 H186 Z"/><circle cx="100" cy="26" r="7" fill="${LIME}" stroke="none"/>`,
  growth: `<path ${a} d="M20 176 H186 M20 176 V20"/><path ${b} d="M30 160 C70 156 100 130 120 96 C136 70 156 46 180 30"/><path ${a} d="M160 26 L182 28 L178 50"/>
    <circle cx="120" cy="96" r="6" fill="${LIME}" stroke="none"/>`,
  globe: `<circle ${a} cx="100" cy="100" r="78"/><ellipse ${b} cx="100" cy="100" rx="34" ry="78"/><path ${a} d="M24 76 H176 M24 124 H176"/>`,
  magnifier: `<circle ${a} cx="86" cy="86" r="56"/><path ${a} d="M128 128 L178 178"/><path ${b} d="M58 92 L78 112 L116 66"/>`,
};

function escapeMarkup(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Renders one text line with Pango (real font metrics), returns {input, width, height}. */
async function textLayer(markup, font, width) {
  const { data, info } = await sharp({ text: { text: markup, font, rgba: true, dpi: 72, width, wrap: "word", align: "left" } })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { input: data, width: info.width, height: info.height };
}

async function titleLayer(title) {
  const safe = escapeMarkup(title);
  // Biggest size that still fits on one line; very long titles wrap to two lines.
  for (let size = 84; size >= 56; size -= 4) {
    const layer = await textLayer(`<span foreground="#ffffff" letter_spacing="-1600">${safe}</span>`, `Inter ExtraBold ${size}`);
    if (layer.width <= TITLE_MAX_WIDTH) return layer;
  }
  return textLayer(`<span foreground="#ffffff" letter_spacing="-1400">${safe}</span>`, "Inter ExtraBold 56", TITLE_MAX_WIDTH);
}

function backgroundSvg(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="violet" cx="0.78" cy="0.02" r="0.62">
      <stop offset="0" stop-color="#5b3fd6" stop-opacity="0.85"/>
      <stop offset="0.55" stop-color="#3a2a8a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#3a2a8a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lime" cx="0.04" cy="1" r="0.55">
      <stop offset="0" stop-color="#9fbf1f" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="#4d5c12" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#4d5c12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0d0d12"/>
  <rect width="${W}" height="${H}" fill="url(#violet)"/>
  <rect width="${W}" height="${H}" fill="url(#lime)"/>
  <g transform="translate(830 205) scale(1.15)" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</g>
</svg>`;
}

export async function makeCover({ file, eyebrow, title, subtitle, icon }) {
  if (!icons[icon]) throw new Error(`${file}: unknown icon "${icon}" (available: ${Object.keys(icons).join(", ")})`);

  const label = await textLayer(
    `<span foreground="${LIME}" letter_spacing="3000">● ${escapeMarkup(eyebrow.toUpperCase())} · AI SOLUTION</span>`,
    "JetBrains Mono 15"
  );
  const head = await titleLayer(title);
  const sub = await textLayer(`<span foreground="#b9b9c6">${escapeMarkup(subtitle)}</span>`, "Inter 26", TITLE_MAX_WIDTH);
  const domain = await textLayer(`<span foreground="#6f6f80" letter_spacing="1000">blog.aisolution.uz</span>`, "JetBrains Mono 15");

  // Text block is centred vertically inside the band every card crop keeps (16:7 → y 52–578).
  const gap = 18;
  const blockHeight = label.height + 28 + head.height + gap + sub.height;
  let y = Math.round((H - blockHeight) / 2) - 10;
  const layers = [];
  layers.push({ ...label, top: y, left: LEFT });
  y += label.height + 28;
  layers.push({ ...head, top: y, left: LEFT - 3 });
  y += head.height + gap;
  layers.push({ ...sub, top: y, left: LEFT });
  layers.push({ ...domain, top: 528, left: LEFT });

  const output = path.join(process.cwd(), "public", "covers", `${file}.png`);
  await sharp(Buffer.from(backgroundSvg(icon)))
    .composite(layers.map(({ input, top, left }) => ({ input, top, left })))
    .png({ compressionLevel: 9, palette: false })
    .toFile(output);
  return output;
}

const filter = process.argv[2];
const specs = coverSpecs.filter((spec) => !filter || spec.file.includes(filter));
for (const spec of specs) {
  const eyebrow = spec.eyebrow ?? eyebrows[spec.lang][spec.cluster];
  await makeCover({ ...spec, eyebrow });
  console.log(`✓ public/covers/${spec.file}.png`);
}
// Covers made here already carry the title, so the site skips its label pill on them.
const allFiles = coverSpecs.map((spec) => spec.file).sort();
fs.writeFileSync(
  path.join(process.cwd(), "lib", "cover-branded.generated.ts"),
  `// Generated by scripts/make-cover.mjs — do not edit by hand.\nexport const BRANDED_COVERS: ReadonlySet<string> = new Set([\n${allFiles.map((f) => `  ${JSON.stringify(`/covers/${f}.png`)}`).join(",\n")}\n]);\n`
);
console.log(`${specs.length} cover(s) made. Next: npm run covers:optimize`);
