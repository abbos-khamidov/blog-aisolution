import { analyticsCspSources, readAnalyticsConfig } from "./lib/analytics-config.mjs";

/** @type {import('next').NextConfig} */

// GA4 / Yandex Metrica hosts are allowed only when their ID is configured (see lib/analytics-config.mjs).
const analytics = analyticsCspSources(readAnalyticsConfig());
const withAnalytics = (base, extra) => [base, ...extra].join(" ");

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
      withAnalytics("img-src 'self' data:", analytics.img),
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      withAnalytics("script-src 'self' 'unsafe-inline'", analytics.script),
      withAnalytics("connect-src 'self'", analytics.connect)
    ].join("; ")
  }
];

const nextConfig = {
  trailingSlash: false,
  output: "standalone",
  // Old topic hubs (before the 4-theme restructure) keep working: permanent
  // redirect to the closest new hub so indexed links and backlinks survive.
  async redirects() {
    const moved = {
      vnedrenie: "reviews",
      prodazhi: "reviews",
      integratsii: "reviews",
      "nlp-uz": "reviews",
      otrasli: "market",
      ekonomika: "market",
      obuchenie: "education"
    };
    return Object.entries(moved).map(([from, to]) => ({
      source: `/:locale(ru|uz)/cluster/${from}`,
      destination: `/:locale/cluster/${to}`,
      permanent: true
    }));
  },
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
