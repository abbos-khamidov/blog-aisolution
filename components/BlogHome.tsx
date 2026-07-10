import Link from "next/link";
import { ContentPostCard } from "./ContentPostCard";
import { Hero } from "./Hero";
import { Reveal } from "./Reveal";
import { SiteHeader } from "./SiteHeader";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import { clusterMeta, getClustersInUse, getOpinionPosts, getPublishedPosts } from "@/lib/content";

const feedFilters = [
  { key: "all", labels: { ru: "Все", uz: "Barchasi" } },
  { key: "aisolution", labels: { ru: "AISOLUTION", uz: "AISOLUTION" } },
  { key: "startup", labels: { ru: "Стартапы", uz: "Startaplar" } },
  { key: "product", labels: { ru: "Продукты", uz: "Mahsulotlar" } },
  { key: "education", labels: { ru: "AI обучение", uz: "AI ta'lim" } },
  { key: "mnenie", labels: { ru: "Мнения", uz: "Fikrlar" } }
] as const;

type FeedFilter = (typeof feedFilters)[number]["key"];

function getFeedFilter(value?: string): FeedFilter {
  return feedFilters.some((filter) => filter.key === value) ? (value as FeedFilter) : "all";
}

function postMatchesFilter(post: ReturnType<typeof getPublishedPosts>[number], filter: FeedFilter): boolean {
  if (filter === "all") return true;
  if (filter === "aisolution") return post.coverLabel === "AISOLUTION";
  if (filter === "startup" || filter === "product") return post.category === filter;
  if (filter === "mnenie") return post.topicCluster === "mnenie";
  return post.coverLabel === "AI EDUCATION";
}

export function BlogHome({ locale, activeFilter }: { locale: Locale; activeFilter?: string }) {
  const t = dictionary[locale];
  const filter = getFeedFilter(activeFilter);
  const posts = getPublishedPosts(locale).filter((post) => postMatchesFilter(post, filter));
  const opinionPosts = getOpinionPosts(locale).slice(0, 2);
  const clusters = getClustersInUse(locale);
  const tickerSignals =
    locale === "ru"
      ? [
          "★ ВАШ СТАРТАП МОЖЕТ БЫТЬ ТУТ",
          "★ ПРОДУКТ НА РАЗБОР",
          "★ PITCH-DECK БЕЗ МАГИИ",
          "★ КОМАНДА, РЫНОК, ДЕНЬГИ",
          "★ VERDICT БЕЗ САХАРА",
          "★ AI SOLUTION SCOUT"
        ]
      : [
          "★ STARTAPINGIZ SHU YERDA BO'LISHI MUMKIN",
          "★ MAHSULOT RAZBORDA",
          "★ PITCH-DECK SEHRSIZ",
          "★ JAMOA, BOZOR, PUL",
          "★ SHAKARSIZ VERDICT",
          "★ AI SOLUTION SCOUT"
        ];

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <Hero locale={locale} />

        <section className="ticker-invite" aria-label={t.tickerInvite}>
          <p>{t.tickerInvite}</p>
          <svg className="ticker-arrow" viewBox="0 0 170 88" fill="none" aria-hidden="true">
            <path
              d="M12 12 C54 6 73 34 61 52 C47 73 90 83 142 54"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M129 45 L149 51 L139 70"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </section>

        <section className="ticker" aria-label="Editorial signals">
          <div className="ticker-track">
            <div className="ticker-group">
              {tickerSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
            <div className="ticker-group" aria-hidden="true">
              {tickerSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="radar" id="clusters">
          <div className="section-head">
            <p className="kicker">{t.clustersKicker}</p>
            <h2>{t.clustersTitle}</h2>
            <p className="section-copy">{t.clustersCopy}</p>
          </div>
          <Reveal className="radar-grid">
            {clusters.map((cluster, index) => (
              <Link key={cluster} className="cluster-card" href={`/${locale}/cluster/${cluster}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{clusterMeta[cluster].title[locale]}</h3>
                <p>{clusterMeta[cluster].description[locale]}</p>
              </Link>
            ))}
          </Reveal>
        </section>

        <section className="feed-section" id="feed">
          <div className="section-head split">
            <div>
              <p className="kicker">{t.feedKicker}</p>
              <h2>{t.feedTitle}</h2>
              <p className="section-copy">{t.feedCopy}</p>
            </div>
            <nav className="filter-pills" aria-label="Feed filter">
              {feedFilters.map((item) => (
                <Link
                  key={item.key}
                  className={filter === item.key ? "is-active" : ""}
                  href={item.key === "all" ? `/${locale}#feed` : `/${locale}?filter=${item.key}#feed`}
                >
                  {item.labels[locale]}
                </Link>
              ))}
            </nav>
          </div>
          <Reveal className="post-grid">
            {posts.map((post, index) => (
              <ContentPostCard key={post.slug} post={post} locale={locale} badge={index === 0 ? "new" : undefined} />
            ))}
          </Reveal>
        </section>

        <section className="feed-section" id="opinion">
          <div className="section-head split">
            <div>
              <p className="kicker">{t.opinionKicker}</p>
              <h2>{t.opinionTitle}</h2>
              <p className="section-copy">{t.opinionCopy}</p>
            </div>
            <Link className="button ghost" href={`/${locale}/opinion`}>
              {t.opinionCta}
            </Link>
          </div>
          <Reveal className="post-grid">
            {opinionPosts.map((post) => (
              <ContentPostCard key={post.slug} post={post} locale={locale} />
            ))}
          </Reveal>
        </section>

        <section className="position" id="position">
          <Reveal className="position-inner" y={20}>
            <div>
              <p className="kicker">{t.positionKicker}</p>
              <h2>{t.positionTitle}</h2>
            </div>
            <div className="position-aside">
              <p>{t.positionCopy}</p>
              <p className="sticker" style={{ marginTop: 20 }}>
                {t.positionSticker}
              </p>
            </div>
          </Reveal>
        </section>
      </main>
    </>
  );
}
