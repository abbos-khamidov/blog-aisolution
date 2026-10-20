import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin"]
    },
    sitemap: "https://blog.aisolution.uz/sitemap.xml",
    host: "blog.aisolution.uz"
  };
}
