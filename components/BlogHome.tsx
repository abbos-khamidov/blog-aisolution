import Link from "next/link";
import type { CSSProperties } from "react";
import { PushSubscribe } from "./PushSubscribe";
import { ScoreRing } from "./ScoreRing";
import { SiteHeader } from "./SiteHeader";
import { MethodSteps } from "./live/MethodSteps";
import { MotionHeading } from "./live/MotionHeading";
import { ScoreBoard, type BoardItem } from "./live/ScoreBoard";
import { BroadcastScene, CoreScene, ScoreRain, SignalScene } from "./live/SectionScenes";
import { StarSky } from "./live/StarSky";
import { VerdictBoard, type VerdictRow } from "./live/VerdictBoard";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";
import {
  clusterMeta,
  formatDate,
  getClustersInUse,
  getOpinionPosts,
  getPublishedPosts,
  getRatedPosts,
  getVerdict,
  type Post
} from "@/lib/content";

/** Short tile name: the part of the title before ":" / "—", else the first words. */
function shortLabel(title: string): string {
  const head = title.split(/[:—–.?!]/)[0].trim();
  if (head.length <= 24) return head;
  const words = head.split(/\s+/);
  let out = "";
  for (const word of words) {
    if ((out + " " + word).trim().length > 22) break;
    out = (out + " " + word).trim();
  }
  return `${out || head.slice(0, 22)}…`;
}

/** Same rules as the old feed pills (components/FeedFilter.tsx), precomputed per post. */
function feedTags(post: Post): string[] {
  const tags: string[] = [];
  if (post.coverLabel === "AISOLUTION") tags.push("aisolution");
  if (post.category === "startup" || post.category === "product") tags.push(post.category);
  if (post.coverLabel === "AI EDUCATION") tags.push("education");
  if (post.topicCluster === "mnenie") tags.push("mnenie");
  return tags;
}

export function BlogHome({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const posts = getPublishedPosts(locale);
  const rated = getRatedPosts(locale);
  const opinions = getOpinionPosts(locale);
  const clusters = getClustersInUse(locale);
  const featured = rated[0];
  const average = rated.length ? rated.reduce((sum, post) => sum + post.rating, 0) / rated.length : 0;
  const strong = rated.filter((post) => getVerdict(post.rating) === "up");

  const verdictLabel = (rating: number) => {
    const verdict = getVerdict(rating);
    return verdict === "up" ? t.ratingVerdictUp : verdict === "average" ? t.ratingVerdictAverage : t.ratingVerdictDown;
  };
  const verdictKey = (post: Post): VerdictRow["verdict"] => {
    if (post.topicCluster === "mnenie") return "opinion";
    return getVerdict(post.rating);
  };
  const meta = (post: Post) => `${clusterMeta[post.topicCluster].title[locale]} · ${formatDate(post.publishedAt, locale)}`;

  const boardItems: BoardItem[] = [...rated, ...opinions.slice(0, Math.max(0, 15 - rated.length))].slice(0, 15).map((post) => ({
    href: `/${locale}/blog/${post.slug}`,
    label: shortLabel(post.title),
    title: post.title,
    meta: meta(post),
    rating: post.topicCluster === "mnenie" ? null : post.rating,
    verdict: verdictKey(post),
    verdictLabel: post.topicCluster === "mnenie" ? t.opinionChip : verdictLabel(post.rating)
  }));

  const rows: VerdictRow[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    meta: meta(post),
    minutes: `${post.readMinutes} ${t.min}`,
    rating: post.topicCluster === "mnenie" ? null : post.rating,
    verdict: verdictKey(post),
    verdictLabel: post.topicCluster === "mnenie" ? t.opinionChip : verdictLabel(post.rating),
    tags: feedTags(post)
  }));

  const filterLabels = [
    { key: "all", label: locale === "ru" ? "Все" : "Barchasi" },
    { key: "startup", label: locale === "ru" ? "Стартапы" : "Startaplar" },
    { key: "product", label: locale === "ru" ? "Продукты" : "Mahsulotlar" },
    { key: "aisolution", label: "AISOLUTION" },
    { key: "education", label: locale === "ru" ? "AI обучение" : "AI ta'lim" },
    { key: "mnenie", label: t.navOpinion }
  ].filter((f) => f.key === "all" || rows.some((row) => row.tags.includes(f.key)));

  const trackedStartups = rated.slice(0, 7).map((post) => ({
    label: shortLabel(post.title).replace(/…$/, "").split(/\s+/).slice(0, 2).join(" ").toUpperCase(),
    rating: post.rating
  }));

  const bins = [5, 6, 7, 8].map((low) => ({
    label: `${low}–${low + 1}`,
    posts: rated.filter((post) => post.rating >= low && post.rating < low + 1).sort((a, b) => a.rating - b.rating)
  }));

  const steps = [
    { title: t.methodStep1, copy: t.methodStep1Copy },
    { title: t.methodStep2, copy: t.ratingMethodCopy },
    { title: t.methodStep3, copy: t.methodStep3Copy },
    { title: t.methodStep4, copy: t.methodStep4Copy }
  ];

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="home">
        <section className="lv-hero" aria-labelledby="hero-title">
          <div className="lv-sky" aria-hidden="true" />
          <div className="lv-bg">
            <StarSky />
          </div>
          <div className="lv-hero-copy">
            <p className="lv-kicker">
              <i className="live-dot" aria-hidden="true" /> {t.homeKicker}
            </p>
            <MotionHeading as="h1" id="hero-title" text={t.homeTitleLead} soft={t.homeTitleSoft} immediate />
            <p className="lv-lead">{t.heroCopy}</p>
            <div className="lv-actions">
              <Link className="button primary" href={`/${locale}#feed`}>
                {t.heroCta}
              </Link>
              <Link className="button ghost" href={`/${locale}#method`}>
                {t.heroSecondary}
              </Link>
            </div>
          </div>
          <div className="lv-stage">
            <ScoreBoard items={boardItems} label={t.boardLabel} />
          </div>
          <dl className="lv-facts">
            <div>
              <dt>{t.statsPostsLabel}</dt>
              <dd>{posts.length}</dd>
            </div>
            <div>
              <dt>{t.factRated}</dt>
              <dd>
                {rated.length} · {t.statsAverageLabel} {average.toFixed(1)}
              </dd>
            </div>
            <div>
              <dt>{t.factLanguages}</dt>
              <dd>{t.factLanguagesValue}</dd>
            </div>
            <div>
              <dt>{t.factCadence}</dt>
              <dd>{t.factCadenceValue}</dd>
            </div>
          </dl>
        </section>

        <section className="lv-section lv-statement" aria-labelledby="statement-title">
          <div className="lv-bg lv-bg-top">
            <SignalScene signalLabel={t.signalLabel} noiseLabel={t.noiseLabel} total={posts.length} />
          </div>
          <MotionHeading id="statement-title" className="lv-big" text={t.statementLead} soft={t.statementQuestion} />
          <div className="lv-problems">
            <article>
              <span>∞</span>
              <h3>{t.problemNoiseTitle}</h3>
              <p>{t.problemNoiseCopy}</p>
            </article>
            <article>
              <span>≠</span>
              <h3>{t.problemTrustTitle}</h3>
              <p>{t.problemTrustCopy}</p>
            </article>
            <article>
              <span>3′</span>
              <h3>{t.problemTimeTitle}</h3>
              <p>{t.problemTimeCopy}</p>
            </article>
          </div>
        </section>

        <section className="lv-core" aria-labelledby="core-title">
          <div className="lv-bg">
            <CoreScene startups={trackedStartups} />
          </div>
          <div className="lv-core-shade" aria-hidden="true" />
          <div className="lv-core-copy">
            <p className="lv-kicker">
              <i className="live-dot" aria-hidden="true" /> {t.coreKicker}
            </p>
            <MotionHeading id="core-title" text={t.coreTitle} />
            <p className="lv-lead">{t.coreCopy}</p>
            <p className="lv-legend">
              <span className="v-up">{t.ratingVerdictUp}, 7.5+</span>
              <span className="v-average">{t.ratingVerdictAverage}, 5.5–7.5</span>
              <span className="v-down">{t.ratingVerdictDown}, &lt; 5.5</span>
            </p>
          </div>
        </section>

        <section className="lv-section lv-verdicts" id="feed" aria-labelledby="verdicts-title">
          <div className="lv-bg lv-bg-rain">
            <ScoreRain ratings={rated.map((post) => post.rating)} />
          </div>
          <div className="lv-head">
            <MotionHeading id="verdicts-title" text={t.verdictsTitle} />
            <p className="lv-lead">{t.verdictsCopy}</p>
          </div>
          {featured && (
            <article className="lv-featured">
              <ScoreRing rating={featured.rating} label={verdictLabel(featured.rating)} size="lg" />
              <div>
                <p className="lv-label">{t.featuredKicker}</p>
                <h3>
                  <Link href={`/${locale}/blog/${featured.slug}`}>{featured.title}</Link>
                </h3>
                <p className="lv-featured-copy">{featured.description}</p>
                <div className="lv-featured-meta">
                  <Link className="button primary" href={`/${locale}/blog/${featured.slug}`}>
                    {t.readReview}
                  </Link>
                  <span>
                    {meta(featured)} · {featured.readMinutes} {t.min}
                  </span>
                </div>
              </div>
            </article>
          )}
          <VerdictBoard
            rows={rows}
            locale={locale}
            readLabel={t.readReview}
            labels={{
              filters: filterLabels,
              saved: t.navSaved,
              search: t.searchLabel,
              searchPlaceholder: t.searchPlaceholder,
              empty: t.searchEmpty,
              emptySaved: t.savedEmpty,
              opinionGroup: t.opinionGroup,
              shownOf: t.shownOf
            }}
          />
        </section>

        <section className="lv-section lv-method" id="method" aria-labelledby="method-title">
          <div>
            <MotionHeading id="method-title" text={t.methodTitle} />
            <p className="lv-lead">{t.methodCopy}</p>
          </div>
          <MethodSteps steps={steps} />
        </section>

        <section className="lv-section" id="clusters" aria-labelledby="clusters-title">
          <div className="lv-head">
            <MotionHeading id="clusters-title" text={t.clustersTitle} />
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

        <section className="lv-section" id="numbers" aria-labelledby="numbers-title">
          <div className="lv-head">
            <MotionHeading id="numbers-title" text={t.numbersTitle} />
            <p className="lv-lead">
              {locale === "ru"
                ? `Из ${rated.length} оценённых разборов только ${strong.length} выше 7.5.`
                : `${rated.length} ta baholangan razbordan faqat ${strong.length} tasi 7.5 dan yuqori.`}
            </p>
          </div>
          <div className="lv-numbers">
            <dl className="lv-stats">
              <div>
                <dd>{posts.length}</dd>
                <dt>{t.numbersTotal}</dt>
              </div>
              <div>
                <dd>{rated.length}</dd>
                <dt>{t.numbersRated}</dt>
              </div>
              <div>
                <dd>{opinions.length}</dd>
                <dt>{t.numbersOpinions}</dt>
              </div>
              <div>
                <dd>{average.toFixed(1)}</dd>
                <dt>{t.numbersAverage}</dt>
              </div>
            </dl>
            <figure className="lv-bins">
              <div className="lv-bins-grid">
                {bins.map((bin) => (
                  <div key={bin.label}>
                    <div className="lv-bin">
                      {bin.posts.map((post, i) => (
                        <Link
                          key={post.slug}
                          href={`/${locale}/blog/${post.slug}`}
                          className={`lv-mini v-${getVerdict(post.rating)}`}
                          title={post.title}
                          style={{ "--i": i } as CSSProperties}
                        >
                          {post.rating.toFixed(1)}
                        </Link>
                      ))}
                    </div>
                    <span className="lv-bin-label">
                      {bin.label} · {bin.posts.length}
                    </span>
                  </div>
                ))}
              </div>
              <figcaption>{t.numbersHint}</figcaption>
            </figure>
          </div>
        </section>

        <section className="lv-section lv-faq" aria-labelledby="faq-title">
          <div>
            <MotionHeading id="faq-title" text={t.faqTitle} />
          </div>
          <div>
            {[
              [t.faqQ1, t.faqA1],
              [t.faqQ2, t.faqA2],
              [t.faqQ3, t.faqA3],
              [t.faqQ4, t.faqA4]
            ].map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lv-section" id="position">
          <div className="lv-position">
            <div>
              <p className="lv-label">{t.positionKicker}</p>
              <h2>{t.positionTitle}</h2>
            </div>
            <div className="lv-position-aside">
              <p>{t.positionCopy}</p>
              {/* Brand motto — only used at a size where its small tagline stays readable. */}
              <img className="brand-motto brand-logo-dark" src="/brand/motto-on-dark.png" alt={t.mottoAlt} width={1219} height={228} />
              <img className="brand-motto brand-logo-light" src="/brand/motto-on-light.png" alt={t.mottoAlt} width={1222} height={232} />
            </div>
          </div>
        </section>

        <section className="lv-final" aria-labelledby="subscribe-title">
          <div className="lv-bg">
            <BroadcastScene />
          </div>
          <MotionHeading id="subscribe-title" text={t.subscribeTitle} />
          <p className="lv-lead">{t.subscribeCopy}</p>
          <div className="lv-final-cta">
            <PushSubscribe locale={locale} />
          </div>
        </section>
      </main>
    </>
  );
}
