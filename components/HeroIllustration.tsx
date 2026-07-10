import { dictionary, type Locale } from "@/lib/i18n";

/**
 * Custom vector illustration for the hero — replaces a generic AI-stock
 * photo with a composition built from the actual logo's language (hexagon
 * outline + circuit nodes), so the hero reads as designed rather than
 * dropped-in stock art.
 */
export function HeroIllustration({ locale }: { locale: Locale }) {
  const t = dictionary[locale];

  return (
    <div className="hero-illustration" aria-hidden="true">
      <svg className="hero-illustration-leftwave" viewBox="0 0 120 520" fill="none">
        <path
          d="M18 20 C42 80 0 124 28 180 C56 236 18 286 40 344 C62 402 34 452 58 500"
          stroke="#d8ff2c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="12 12"
        />
        <circle cx="18" cy="20" r="6" fill="#fff" />
        <circle cx="28" cy="180" r="6" fill="#ff5b1f" />
        <circle cx="40" cy="344" r="6" fill="#5b7cff" />
        <circle cx="58" cy="500" r="6" fill="#d8ff2c" />
      </svg>

      <div className="hero-illustration-note">
        <span>{t.heroVisualKicker}</span>
        <strong>{t.heroVisualTitle}</strong>
        <p>{t.heroVisualCopy}</p>
      </div>

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

      <div className="hero-illustration-card card-a">
        <div className="bars">
          <span className="bar" style={{ height: "30%", background: "#0d2bff" }} />
          <span className="bar" style={{ height: "55%", background: "#ff5b1f" }} />
          <span className="bar" style={{ height: "75%", background: "#0d2bff" }} />
          <span className="bar" style={{ height: "100%", background: "#d8ff2c" }} />
        </div>
        <small>{t.heroCardGrowth}</small>
      </div>

      <div className="hero-illustration-card card-b">
        <strong>24/7</strong>
        <small>{t.heroCardControl}</small>
      </div>

      <div className="hero-illustration-card card-c">
        <strong>+38%</strong>
        <small>{t.heroCardRoutine}</small>
      </div>
    </div>
  );
}
