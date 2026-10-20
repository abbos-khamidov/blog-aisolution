import { describe, expect, it } from "vitest";
import { renderMarkdownPreview, textStats } from "./markdown-preview";

describe("renderMarkdownPreview", () => {
  it("renders the formatting posts use", () => {
    const html = renderMarkdownPreview("## Sarlavha\n\nOddiy **qalin** va *kursiv* `kod`.\n\n- bir\n- ikki\n\n1. birinchi\n\n> iqtibos");
    expect(html).toContain("<h2>Sarlavha</h2>");
    expect(html).toContain("<strong>qalin</strong>");
    expect(html).toContain("<em>kursiv</em>");
    expect(html).toContain("<code>kod</code>");
    expect(html).toContain("<ul><li>bir</li><li>ikki</li></ul>");
    expect(html).toContain("<ol><li>birinchi</li></ol>");
    expect(html).toContain("<blockquote><p>iqtibos</p></blockquote>");
  });

  it("escapes HTML so nothing typed can run", () => {
    const html = renderMarkdownPreview('<script>alert(1)</script> <img src=x onerror="x">');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("only links to safe addresses", () => {
    expect(renderMarkdownPreview("[ok](https://aisolution.uz)")).toContain('href="https://aisolution.uz"');
    const bad = renderMarkdownPreview("[x](javascript:alert(1))");
    expect(bad).not.toContain("href");
  });

  it("keeps code blocks verbatim", () => {
    expect(renderMarkdownPreview("```\n**not bold** <b>\n```")).toContain("<pre><code>**not bold** &lt;b&gt;</code></pre>");
  });
});

describe("textStats", () => {
  it("counts words and minutes", () => {
    expect(textStats("bir ikki uch — ##")).toEqual({ words: 3, minutes: 1 });
    expect(textStats(Array(450).fill("so'z").join(" ")).minutes).toBe(2);
  });
});
