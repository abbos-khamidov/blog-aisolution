/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  output: "standalone",
  // The admin panel and its API are never indexed or cached by anyone in between.
  async headers() {
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "same-origin" }
    ];
    return [
      { source: "/admin", headers: privateHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/api/admin/:path*", headers: privateHeaders }
    ];
  }
};

export default nextConfig;
