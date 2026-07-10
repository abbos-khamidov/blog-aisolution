import type { CSSProperties } from "react";
import { clusterAccent, clusterCoverImage, clusterMeta } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import type { TopicCluster } from "@/lib/schema";

type Props = {
  cluster: TopicCluster;
  locale: Locale;
  cover?: string;
  label?: string;
  logo?: string;
  size?: "card" | "hero";
};

export function PostCover({ cluster, locale, cover, label, logo, size = "card" }: Props) {
  const coverImage = cover?.startsWith("/covers/") ? cover : clusterCoverImage[cluster];
  const logoImage = logo ?? "/brand/site-mark.png";

  return (
    <div
      className={`post-cover post-cover-${cluster}${size === "hero" ? " post-cover-hero" : ""}`}
      style={{ "--cover-accent": clusterAccent[cluster], "--cover-image": `url(${coverImage})` } as CSSProperties}
    >
      <span>{label ?? clusterMeta[cluster].title[locale]}</span>
      <img className="post-cover-logo" src={logoImage} alt="" />
    </div>
  );
}
