import { analyticsCspSources, readAnalyticsConfig } from "./analytics-config.mjs";

export { analyticsCspSources, readAnalyticsConfig };
export type AnalyticsConfig = ReturnType<typeof readAnalyticsConfig>;

export function gaInitScript(gaId: string): string {
  // Page views on client-side navigation come from GA4 "enhanced measurement"
  // (browser history events), which is on by default for a web stream.
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
}

export function ymInitScript(ymId: string): string {
  // Official tag loader; webvisor (session recording) stays off on purpose.
  return `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${ymId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`;
}
