import Link from "next/link";
import { ContentPostCard } from "./ContentPostCard";
import { SiteHeader } from "./SiteHeader";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import { clusterMeta, getClustersInUse, getPublishedPosts } from "@/lib/content";

export function BlogHome({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const posts = getPublishedPosts(locale);
  const clusters = getClustersInUse(locale);

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-label-row">
              <p className="kicker">{t.heroKicker}</p>
              <span className="signal-pill">AI / Central Asia</span>
            </div>
            <h1>{t.heroTitle}</h1>
            <p className="hero-copy">{t.heroCopy}</p>
            <div className="hero-actions">
              <a className="button primary" href="#feed">
                {t.heroCta}
              </a>
              <a className="button ghost" href="#position">
                {t.heroSecondary}
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/aisolution-blog-hero.png" alt="AI Solution" />
            <img className="hero-motto hero-motto-light" src="/brand/motto-light-transparent.png" alt="AI Solution motto" />
            <img className="hero-motto hero-motto-dark" src="/brand/motto-dark-transparent.png" alt="AI Solution motto" />
          </div>
        </section>

        <section className="ticker" aria-label="Editorial signals">
          <div>
            <span>AISOLUTION</span>
            <span>AI Solution</span>
            <span>aisolutions</span>
            <span>AI CRM Uzbekistan</span>
          </div>
        </section>

        <section className="radar" id="clusters">
          <div className="section-head">
            <p className="kicker">{t.clustersKicker}</p>
            <h2>{t.clustersTitle}</h2>
            <p className="section-copy">{t.clustersCopy}</p>
          </div>
          <div className="radar-grid">
            {clusters.map((cluster, index) => (
              <Link key={cluster} className="cluster-card" href={`/${locale}/cluster/${cluster}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{clusterMeta[cluster].title[locale]}</h3>
                <p>{clusterMeta[cluster].description[locale]}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="feed-section" id="feed">
          <div className="section-head split">
            <div>
              <p className="kicker">{t.feedKicker}</p>
              <h2>{t.feedTitle}</h2>
              <p className="section-copy">{t.feedCopy}</p>
            </div>
          </div>
          <div className="post-grid">
            {posts.map((post) => (
              <ContentPostCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
        </section>

        <section className="position" id="position">
          <div>
            <p className="kicker">{t.positionKicker}</p>
            <h2>{t.positionTitle}</h2>
          </div>
          <p>{t.positionCopy}</p>
        </section>
      </main>

      <footer className="site-footer">
        <span>AI Solution Blog</span>
        <Link href="https://aisolution.uz">aisolution.uz</Link>
      </footer>
    </>
  );
}
