import { describe, expect, it } from "vitest";
import { formatDate, getVerdict } from "./post-display";

describe("formatDate", () => {
  it("spells Uzbek months without relying on the browser's ICU data", () => {
    expect(formatDate("2026-08-14", "uz")).toBe("14-avg, 2026");
    expect(formatDate("2026-01-03", "uz")).toBe("03-yan, 2026");
    expect(formatDate("2026-12-31", "uz")).toBe("31-dek, 2026");
  });

  it("keeps the calendar day regardless of time zone", () => {
    expect(formatDate("2026-10-01", "ru")).toContain("01");
  });
});

describe("getVerdict", () => {
  it("uses the editorial thresholds", () => {
    expect(getVerdict(7.5)).toBe("up");
    expect(getVerdict(5.5)).toBe("average");
    expect(getVerdict(5.4)).toBe("down");
  });
});
