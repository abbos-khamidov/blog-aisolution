/**
 * Google Analytics 4 and Yandex Metrica, both OFF unless their ID is set at
 * build time (next build reads .env.production):
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_YM_ID=12345678
 * Plain .mjs so next.config.mjs (CSP) and the app share one source of truth.
 * IDs go into inline scripts and the CSP, so anything that does not look like
 * a real ID is ignored instead of being printed into the page.
 */
const GA_ID = /^G-[A-Z0-9]{4,16}$/;
const YM_ID = /^\d{5,12}$/;

/** @param {Record<string, string | undefined>} env @returns {{ gaId?: string, ymId?: string }} */
export function readAnalyticsConfig(env = process.env) {
  const ga = env.NEXT_PUBLIC_GA_ID?.trim();
  const ym = env.NEXT_PUBLIC_YM_ID?.trim();
  return {
    gaId: ga && GA_ID.test(ga) ? ga : undefined,
    ymId: ym && YM_ID.test(ym) ? ym : undefined
  };
}

/** Extra Content-Security-Policy sources, only for the services that are switched on. */
export function analyticsCspSources(/** @type {{ gaId?: string, ymId?: string }} */ config) {
  /** @type {string[]} */ const script = [];
  /** @type {string[]} */ const connect = [];
  /** @type {string[]} */ const img = [];
  if (config.gaId) {
    script.push("https://www.googletagmanager.com");
    connect.push("https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com");
    img.push("https://*.google-analytics.com", "https://www.googletagmanager.com");
  }
  if (config.ymId) {
    script.push("https://mc.yandex.ru");
    connect.push("https://mc.yandex.ru", "https://mc.yandex.com");
    img.push("https://mc.yandex.ru", "https://mc.yandex.com");
  }
  return { script, connect, img };
}
