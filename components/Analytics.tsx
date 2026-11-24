import Script from "next/script";
import { gaInitScript, readAnalyticsConfig, ymInitScript } from "@/lib/analytics";
import { YandexPageviews } from "./YandexPageviews";

/** GA4 + Yandex Metrica tags; renders nothing when no ID is configured. */
export function Analytics() {
  const { gaId, ymId } = readAnalyticsConfig();
  if (!gaId && !ymId) return null;

  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {gaInitScript(gaId)}
          </Script>
        </>
      )}
      {ymId && (
        <>
          <Script id="ym-init" strategy="afterInteractive">
            {ymInitScript(ymId)}
          </Script>
          <YandexPageviews ymId={Number(ymId)} />
        </>
      )}
    </>
  );
}
