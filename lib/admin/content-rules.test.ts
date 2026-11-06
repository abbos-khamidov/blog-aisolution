import { describe, expect, it } from "vitest";
import { frontmatterTextReason, isLocalPath, unsafeContentReason } from "./content-rules";

describe("unsafeContentReason", () => {
  it("allows normal Markdown", () => {
    expect(unsafeContentReason("## Sarlavha\n\n**Qalin**, [havola](https://aisolution.uz), [ichki](/uz/blog/x).\n\n> iqtibos\n\n- 5 < 7 va 7 > 5")).toBeNull();
  });
  it("blocks HTML/JSX that MDX would render", () => {
    for (const bad of ["<script>alert(1)</script>", "<iframe src=https://evil.example>", "<img src=x onerror=alert(1)>", "<Foo />", "<!-- x -->", "</div>"]) {
      expect(unsafeContentReason(`Matn ${bad} davomi`)).not.toBeNull();
    }
  });
  it("blocks dangerous link schemes", () => {
    expect(unsafeContentReason("[bos](javascript:alert(1))")).not.toBeNull();
    expect(unsafeContentReason("[bos]( JavaScript:alert(1))")).not.toBeNull();
    expect(unsafeContentReason("[bos](data:text/html;base64,xx)")).not.toBeNull();
    expect(unsafeContentReason("[ref]: javascript:alert(1)")).not.toBeNull();
  });
  it("blocks MDX expressions but allows escaped braces", () => {
    expect(unsafeContentReason("Natija {process.env.SECRET}")).not.toBeNull();
    expect(unsafeContentReason("Natija \\{ bu oddiy matn \\}")).toBeNull();
  });
  it("ignores tags inside code", () => {
    expect(unsafeContentReason("Misol: `<script>` va\n\n```\n<div>{x}</div>\n```")).toBeNull();
  });
});

describe("isLocalPath", () => {
  it("accepts site paths only", () => {
    expect(isLocalPath("/covers/startup-team.png")).toBe(true);
    expect(isLocalPath("/contacts")).toBe(true);
    for (const bad of ["//evil.example/x.png", "https://evil.example", "/covers/../../etc/passwd", "/\\evil.example", "javascript:alert(1)", "/a b.png"]) {
      expect(isLocalPath(bad)).toBe(false);
    }
  });
});

describe("frontmatterTextReason", () => {
  it("sarlavhada < > ni rad etadi (JSON-LD XSS himoyasi)", () => {
    expect(frontmatterTextReason("Oddiy sarlavha")).toBeNull();
    expect(frontmatterTextReason("A </script><script>x</script>")).not.toBeNull();
    expect(frontmatterTextReason("narx < 5")).not.toBeNull();
  });
});
