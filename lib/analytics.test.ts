import { describe, expect, it } from "vitest";
import { analyticsCspSources, gaInitScript, readAnalyticsConfig, ymInitScript } from "./analytics";

describe("readAnalyticsConfig", () => {
  it("is off when nothing is set", () => {
    expect(readAnalyticsConfig({})).toEqual({ gaId: undefined, ymId: undefined });
    expect(analyticsCspSources({})).toEqual({ script: [], connect: [], img: [] });
  });

  it("accepts real-looking IDs", () => {
    expect(readAnalyticsConfig({ NEXT_PUBLIC_GA_ID: " G-AB12CD34EF ", NEXT_PUBLIC_YM_ID: "98765432" })).toEqual({
      gaId: "G-AB12CD34EF",
      ymId: "98765432"
    });
  });

  it("ignores anything that could inject code into the page", () => {
    const config = readAnalyticsConfig({ NEXT_PUBLIC_GA_ID: "G-1');alert(1);//", NEXT_PUBLIC_YM_ID: "1,0);alert(1" });
    expect(config).toEqual({ gaId: undefined, ymId: undefined });
  });
});

describe("analytics snippets and CSP", () => {
  it("opens the CSP only for the configured service", () => {
    const ga = analyticsCspSources({ gaId: "G-AB12CD34EF" });
    expect(ga.script).toEqual(["https://www.googletagmanager.com"]);
    expect(ga.connect.some((host) => host.includes("yandex"))).toBe(false);

    const ym = analyticsCspSources({ ymId: "98765432" });
    expect(ym.script).toEqual(["https://mc.yandex.ru"]);
    expect(ym.connect.some((host) => host.includes("google"))).toBe(false);
  });

  it("puts the ID into the init snippets, with webvisor off", () => {
    expect(gaInitScript("G-AB12CD34EF")).toContain("gtag('config','G-AB12CD34EF')");
    const ym = ymInitScript("98765432");
    expect(ym).toContain('ym(98765432,"init"');
    expect(ym).toContain("webvisor:false");
  });
});
