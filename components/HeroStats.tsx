"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n";

type Stats = {
  today: number;
  year: number;
  total: number;
};

type Props = {
  locale: Locale;
  stats: Stats;
};

function useCountUp(target: number, active = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return undefined;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 700 + Math.min(target * 18, 450);

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active, target]);

  return value;
}

function StatTile({ label, value, locale }: { label: string; value: number; locale: Locale }) {
  const animated = useCountUp(value, true);
  const numberFormat = new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : "ru-RU");
  return (
    <div className="hero-stat">
      <strong>{numberFormat.format(animated)}</strong>
      <span>{label}</span>
    </div>
  );
}

export function HeroStats({ locale, stats }: Props) {
  const t = dictionary[locale];
  const tiles = useMemo(
    () => [
      { label: t.statsTodayLabel, value: stats.today },
      { label: t.statsYearLabel, value: stats.year },
      { label: t.statsTotalLabel, value: stats.total }
    ],
    [stats.today, stats.year, stats.total, t.statsTodayLabel, t.statsTotalLabel, t.statsYearLabel]
  );

  return (
    <section className="hero-stats" aria-label={t.statsTitle}>
      <div className="hero-stats-head">
        <p className="kicker">{t.statsKicker}</p>
        <h2>{t.statsTitle}</h2>
      </div>
      <div className="hero-stats-grid" role="list">
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} locale={locale} />
        ))}
      </div>
    </section>
  );
}
