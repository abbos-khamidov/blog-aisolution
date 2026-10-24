import { describe, expect, it } from "vitest";
import { coverSrc } from "./cover-src";

describe("coverSrc", () => {
  it("uses the light WebP copy when it exists", () => {
    expect(coverSrc("/covers/startup-team.png", 640)).toBe("/covers/opt/startup-team-640.webp");
    expect(coverSrc("/covers/startup-team.png", 1280)).toBe("/covers/opt/startup-team-1280.webp");
  });
  it("falls back to the original file", () => {
    expect(coverSrc("/covers/not-optimized-yet.png", 640)).toBe("/covers/not-optimized-yet.png");
    expect(coverSrc("/brand/logo.png", 640)).toBe("/brand/logo.png");
  });
});
