import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/ais-pulse"
    },
    sitemap: "https://blog.aisolution.uz/sitemap.xml"
  };
}
