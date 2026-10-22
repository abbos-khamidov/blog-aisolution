import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDataDir } from "./data-dir";

describe("resolveDataDir", () => {
  it("uses <project>/data in dev", () => {
    expect(resolveDataDir("/home/me/blog", {})).toBe(path.join("/home/me/blog", "data"));
  });
  it("steps out of .next/standalone so deploys don't wipe admin posts", () => {
    expect(resolveDataDir("/var/www/blog/.next/standalone", {})).toBe(path.resolve("/var/www/blog/data"));
  });
  it("ADMIN_DATA_DIR wins", () => {
    expect(resolveDataDir("/var/www/blog/.next/standalone", { ADMIN_DATA_DIR: "/srv/blog-data" })).toBe(path.resolve("/srv/blog-data"));
  });
});
