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
  vnedrenie: "#3aa0ff",
  prodazhi: "#ff8a3d",
  integratsii: "#2fd489",
  "nlp-uz": "#b98bff",
  otrasli: "#f5b642",
  ekonomika: "#41c9e2",
  obuchenie: "#ff6fa8",
  mnenie: "#8f9bb3"
};

export const clusterCoverImage: Record<TopicCluster, string> = {
  vnedrenie: "/covers/startup-team.png",
  prodazhi: "/covers/growth-dashboard.png",
  integratsii: "/covers/product-lab.png",
  "nlp-uz": "/covers/product-lab.png",
  otrasli: "/covers/startup-team.png",
  ekonomika: "/covers/market-money.png",
  obuchenie: "/covers/startup-team.png",
  mnenie: "/covers/market-money.png"
};

export const clusterMeta: Record<TopicCluster, { title: Record<Locale, string>; description: Record<Locale, string> }> = {
  vnedrenie: {
    title: { ru: "Оценка стартапов", uz: "Startap bahosi" },
    description: {
      ru: "Продукт, команда, рынок, деньги: быстро отделяем бизнес от презентации.",
      uz: "Mahsulot, jamoa, bozor, pul: biznesni pitchdan tez ajratamiz."
    }
  },
  prodazhi: {
    title: { ru: "Go-to-market и рост", uz: "Go-to-market va o'sish" },
    description: {
      ru: "Кому продают, как растут и где воронка держится на честном спросе.",
      uz: "Kimga sotadi, qanday o'sadi va funnel qayerda real talabga suyanadi."
    }
  },
  integratsii: {
    title: { ru: "Продукт и стек", uz: "Mahsulot va stack" },
    description: {
      ru: "Что реально собрано, что только нарисовано и где технология не выдержит рынок.",
      uz: "Nima real yig'ilgan, nima faqat chizilgan va texnologiya qayerda bozorga dosh bermaydi."
    }
  },
  "nlp-uz": {
    title: { ru: "AI-угол", uz: "AI burchagi" },
    description: {
      ru: "Где AI усиливает продукт, а где его приклеили ради красивого слайда.",
      uz: "AI qayerda mahsulotni kuchaytiradi, qayerda faqat chiroyli slayd uchun yopishtirilgan."
    }
  },
  otrasli: {
    title: { ru: "Рынки и ниши", uz: "Bozorlar va nishalar" },
    description: {
      ru: "Большой ли рынок, больная ли боль и есть ли там место новому игроку.",
      uz: "Bozor kattami, og'riq haqiqiymi va yangi o'yinchiga joy bormi."
    }
  },
  ekonomika: {
    title: { ru: "Деньги и оценка", uz: "Pul va baholash" },
    description: {
      ru: "Выручка, юнит-экономика, runway и valuation без магии в Excel.",
      uz: "Tushum, unit economics, runway va valuation — Excel sehrisiz."
    }
  },
  obuchenie: {
    title: { ru: "Команда и талант", uz: "Jamoa va talent" },
    description: {
      ru: "Кто строит, кто продает, кто тащит, а кто просто красиво рассказывает.",
      uz: "Kim quradi, kim sotadi, kim tortadi, kim faqat chiroyli gapiradi."
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

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}
