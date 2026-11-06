/** @type {import('next').NextConfig} */

// On every page: stop MIME-sniffing, block framing (clickjacking), force HTTPS
// for two years (HSTS), limit the referer, and a Content-Security-Policy that
// still allows the site's own inline theme script, JSON-LD and Google Fonts but
// blocks any injected <script src>, plugins and framing.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'"
    ].join("; ")
  }
];

const nextConfig = {
  trailingSlash: false,
  output: "standalone",
  async headers() {
    // The admin panel and its API are also never indexed or cached by anyone in between.
    const privateHeaders = [
      ...securityHeaders,
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "same-origin" }
    ];
    return [
      { source: "/admin", headers: privateHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/api/admin/:path*", headers: privateHeaders },
      { source: "/:path*", headers: securityHeaders }
    ];
  }
};

export default nextConfig;
