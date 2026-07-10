import { dictionary, type Locale } from "@/lib/i18n";

type Stats = { today: number; year: number; total: number };

/**
 * Custom vector illustration for the hero — replaces a generic AI-stock
 * photo with a composition built from the actual logo's language (hexagon
 * outline + circuit nodes), plus the one number a visitor actually needs on
 * first paint: how many startups have been reviewed, and how many today.
 */
export function HeroIllustration({ locale, stats }: { locale: Locale; stats: Stats }) {
  const t = dictionary[locale];
  const numberFormat = new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU");

  return (
    <div className="hero-illustration" aria-hidden="true">
      <svg className="hero-illustration-leftwave" viewBox="0 0 60 520" fill="none">
        <path
          d="M20 18 C32 70 12 122 24 176 C36 230 14 284 26 338 C38 392 18 448 30 502"
          stroke="#d8ff2c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="10 12"
        />
        <circle cx="20" cy="18" r="6" fill="#fff" />
        <circle cx="26" cy="338" r="6" fill="#5b7cff" />
        <circle cx="30" cy="502" r="6" fill="#d8ff2c" />
      </svg>

      <svg className="hero-illustration-hex" viewBox="0 0 200 200" fill="none">
        <defs>
          <linearGradient id="hexStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d8ff2c" />
            <stop offset="55%" stopColor="#5b7cff" />
            <stop offset="100%" stopColor="#0d2bff" />
          </linearGradient>
        </defs>
        <polygon
          points="100,10 177.9,55 177.9,145 100,190 22.1,145 22.1,55"
          stroke="url(#hexStroke)"
          strokeWidth="3"
        />
      </svg>

      <svg className="hero-illustration-line" viewBox="0 0 260 160" fill="none">
        <path d="M10 130 L60 130 L60 80 L100 80 L100 40 L150 40" stroke="#d8ff2c" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="10" cy="130" r="5" fill="#d8ff2c" />
        <circle cx="60" cy="80" r="5" fill="#5b7cff" />
        <circle cx="100" cy="40" r="5" fill="#ff5b1f" />
        <circle cx="150" cy="40" r="5" fill="#d8ff2c" />
        <circle className="circuit-pulse" r="4" fill="#fff" opacity="0" />
      </svg>

      <div className="hero-illustration-stat">
        <span className="hero-illustration-stat-kicker">{t.heroVisualKicker}</span>
        <strong>{t.heroVisualTitle}</strong>
        <div className="hero-illustration-stat-row">
          <div>
            <b>{numberFormat.format(stats.year)}</b>
            <small>{t.statsYearLabel}</small>
          </div>
          <div>
            <b>{numberFormat.format(stats.today)}</b>
            <small>{t.statsTodayLabel}</small>
          </div>
        </div>
      </div>

      <div className="hero-illustration-card card-a">
        <div className="bars">
          <span className="bar" style={{ height: "30%", background: "#0d2bff" }} />
          <span className="bar" style={{ height: "55%", background: "#ff5b1f" }} />
          <span className="bar" style={{ height: "75%", background: "#0d2bff" }} />
          <span className="bar" style={{ height: "100%", background: "#d8ff2c" }} />
        </div>
        <small>{t.heroCardGrowth}</small>
      </div>

      <div className="hero-illustration-card card-c">
        <strong>+38%</strong>
        <small>{t.heroCardRoutine}</small>
      </div>
    </div>
  );
}
