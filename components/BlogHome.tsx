import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "./PostCard";
import { SiteHeader } from "./SiteHeader";

export function BlogHome({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const posts = getPublishedPosts();

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <section className="hero">
          <img src="/images/aisolution-blog-hero.png" alt="AISOLUTION editorial AI newsroom" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="kicker">{t.heroKicker}</p>
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
        </section>

        <section className="ticker" aria-label="Editorial signals">
          <div>
            <span>AISOLUTION</span>
            <span>AI Solution</span>
            <span>aisolutions</span>
            <span>AI CRM Uzbekistan</span>
            <span>Market radar</span>
            <span>New faces</span>
          </div>
        </section>

        <section className="radar" id="radar">
          <div className="section-head">
            <p className="kicker">{t.radarKicker}</p>
            <h2>{t.radarTitle}</h2>
          </div>
          <div className="radar-grid">
            <article>
              <span>01</span>
              <h3>{t.radarOneTitle}</h3>
              <p>{t.radarOneCopy}</p>
            </article>
            <article>
              <span>02</span>
              <h3>{t.radarTwoTitle}</h3>
              <p>{t.radarTwoCopy}</p>
            </article>
            <article>
              <span>03</span>
              <h3>{t.radarThreeTitle}</h3>
              <p>{t.radarThreeCopy}</p>
            </article>
          </div>
        </section>

        <section className="feed-section" id="feed">
          <div className="section-head split">
            <div>
              <p className="kicker">{t.feedKicker}</p>
              <h2>{t.feedTitle}</h2>
            </div>
            <div className="filter-pills" aria-label="Post filters">
              <button className="is-active" type="button">
                {t.filtersAll}
              </button>
              <button type="button">CRM</button>
              <button type="button">{t.filtersRadar}</button>
              <button type="button">{t.filtersFaces}</button>
            </div>
          </div>
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
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
        <span>AISOLUTION Blog</span>
        <Link href="https://aisolution.uz">aisolution.uz</Link>
        <Link href="/ais-pulse" rel="nofollow">
          editor
        </Link>
      </footer>
    </>
  );
}
