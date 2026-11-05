import type { Locale } from "./i18n";
import type { Frontmatter, TopicCluster } from "./schema";

/**
 * Display-only helpers with zero Node built-ins (no fs/path) — safe to
 * import from Client Components. lib/content.ts re-exports all of this for
 * server-side callers; components that render inside a "use client" tree
 * (ContentPostCard, PostCover, FeedFilter) must import from here directly,
 * otherwise webpack drags content.ts's fs/path usage into the client bundle.
 */

export type Post = Frontmatter & {
  content: string;
  readMinutes: number;
};

export const clusterAccent: Record<TopicCluster, string> = {
  education: "#ff6fa8",
  market: "#41c9e2",
  reviews: "#2fd489",
  founders: "#f5b642",
  mnenie: "#8f9bb3"
};

export const clusterCoverImage: Record<TopicCluster, string> = {
  education: "/covers/ai-education-tashkent.png",
  market: "/covers/market-money.png",
  reviews: "/covers/product-lab.png",
  founders: "/covers/startup-team.png",
  mnenie: "/covers/market-money.png"
};

export const clusterMeta: Record<TopicCluster, { title: Record<Locale, string>; description: Record<Locale, string> }> = {
  education: {
    title: { ru: "ИИ-образование и обучение в Узбекистане", uz: "O'zbekistonda AI ta'limi va o'qitish" },
    description: {
      ru: "Курсы, школы и программы по ИИ: кто реально учит, а кто продаёт сертификаты.",
      uz: "AI kurslari, maktablari va dasturlari: kim haqiqatan o'qitadi, kim faqat sertifikat sotadi."
    }
  },
  market: {
    title: { ru: "Анализ технологического рынка", uz: "Texnologiya bozori tahlili" },
    description: {
      ru: "Игроки, инвестиции, регулирование и цены на рынке технологий и ИИ в Узбекистане и Центральной Азии.",
      uz: "O'zbekiston va Markaziy Osiyo texnologiya va AI bozoridagi o'yinchilar, investitsiyalar, tartibga solish va narxlar."
    }
  },
  reviews: {
    title: { ru: "Обзоры ПО и разбор продуктов", uz: "Dasturlar sharhi va mahsulot tahlili" },
    description: {
      ru: "Что продукт делает на самом деле: функции, цена, стек и честная оценка.",
      uz: "Mahsulot aslida nima qiladi: imkoniyatlari, narxi, texnologiyasi va halol baho."
    }
  },
  founders: {
    title: { ru: "Основатели и таланты Узбекистана", uz: "O'zbekiston asoschilari va talantlari" },
    description: {
      ru: "Кто строит технологические компании и AI-продукты в Узбекистане и кого стоит слушать.",
      uz: "O'zbekistonda texnologik kompaniyalar va AI mahsulotlarni kim quryapti va kimni tinglash kerak."
    }
  },
  mnenie: {
    title: { ru: "Мнения", uz: "Fikrlar" },
    description: {
      ru: "Колонки и позиции редакции: где проходит граница между фактом, оценкой и красивой упаковкой.",
      uz: "Tahririyat ustunlari va pozitsiyalari: fakt, baho va chiroyli qadoq orasidagi chegara qayerda."
    }
  }
};

/**
 * "up" mirrors the "годно" verdict shown on post cards — our own rating,
 * not a claim about the company's real-world fundraising or survival.
 */
export function getVerdict(rating: number): "up" | "average" | "down" {
  if (rating >= 7.5) return "up";
  if (rating >= 5.5) return "average";
  return "down";
}

// Many browsers ship without Uzbek ICU data and print "2026 M08 14" instead of
// "14-avg, 2026" — which also differs from the server render and breaks
// hydration. Uzbek month names are therefore spelled out here, not via Intl.
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Calendar date (YYYY-MM-DD frontmatter) → "14-avg, 2026" / "14 авг. 2026 г." */
export function formatDate(value: string, locale: Locale): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (locale === "uz") {
    return `${pad(date.getUTCDate())}-${UZ_MONTHS[date.getUTCMonth()]}, ${date.getUTCFullYear()}`;
  }
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
