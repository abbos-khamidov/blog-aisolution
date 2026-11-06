import { describe, expect, it } from "vitest";
import { jsonLdScript } from "./jsonld";

describe("jsonLdScript (XSS himoyasi)", () => {
  it("</script> ni script'dan chiqarmaydi", () => {
    const out = jsonLdScript({ headline: 'A </script><script>alert(document.cookie)</script> B' });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("\\u003c");
    // sahifaga qo'yilganda hujum ishga tushmaydi
    const html = `<script type="application/ld+json">${out}</script>`;
    expect(html.includes("</script><script>alert")).toBe(false);
  });
  it("hali ham to'g'ri JSON", () => {
    const out = jsonLdScript({ a: "x < y & z > w", nested: { t: "</style>" } });
    expect(JSON.parse(out)).toEqual({ a: "x < y & z > w", nested: { t: "</style>" } });
  });
  it("satr ajratgichlarni ham escape qiladi", () => {
    const sep = String.fromCharCode(0x2028) + String.fromCharCode(0x2029);
    const out = jsonLdScript({ t: "a" + sep + "b" });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });
});
