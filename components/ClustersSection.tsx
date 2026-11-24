import Link from "next/link";
import { MotionHeading } from "./live/MotionHeading";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import { clusterMeta, getClustersInUse } from "@/lib/content";

/**
 * "Темы": a card per topic hub. Shown on the homepage and, with an <h1>, as
 * the /[locale]/topics page.
 */
export function ClustersSection({ locale, headingAs = "h2", heading }: { locale: Locale; headingAs?: "h1" | "h2"; heading?: string }) {
  const t = dictionary[locale];
  const clusters = getClustersInUse(locale);

  return (
    <section className="lv-section" id="clusters" aria-labelledby="clusters-title">
      <div className="lv-head">
        <MotionHeading as={headingAs} id="clusters-title" text={heading ?? t.clustersTitle} immediate={headingAs === "h1"} />
        <p className="lv-lead">{t.clustersCopy}</p>
      </div>
      <div className="lv-clusters">
        {clusters.map((cluster) => (
          <Link key={cluster} className="lv-cluster" href={`/${locale}/cluster/${cluster}`}>
            <h3>{clusterMeta[cluster].title[locale]}</h3>
            <p>{clusterMeta[cluster].description[locale]}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
