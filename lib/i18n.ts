export const locales = ["ru", "uz"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const dictionary = {
  ru: {
    metaTitle: "AI Solution Blog — мнение компании об ИИ в Узбекистане",
    metaDescription: "Блог AI Solution: позиция компании по внедрению ИИ, автоматизации продаж и CRM для бизнеса в Узбекистане и Центральной Азии.",
    navClusters: "Темы",
    navFeed: "Материалы",
    navPosition: "Позиция",
    heroKicker: "AISOLUTION brief / без пресной корпоративщины",
    heroTitle: "ИИ в регионе. Наша позиция, а не пересказ чужих новостей.",
    heroCopy: "Коротко и по делу: что мы думаем про внедрение ИИ, продажи, CRM и рынок Центральной Азии — с личным тезисом в каждом материале.",
    heroCta: "Открыть материалы",
    heroSecondary: "Наша позиция",
    clustersKicker: "по чему у нас есть позиция",
    clustersTitle: "Темы, а не рубрики ради рубрик",
    clustersCopy: "Каждая статья привязана к одной теме — так проще найти материалы по своей задаче.",
    feedKicker: "свежие публикации",
    feedTitle: "Материалы AI Solution",
    feedCopy: "Тезис, аргумент, пример из практики, вывод. Без пересказа чужих новостей.",
    filtersAll: "Все",
    positionKicker: "SEO, но по-человечески",
    positionTitle: "Не новостная лента. Публичная позиция AI Solution.",
    positionCopy: "Каждая публикация — это точка зрения компании, а не рерайт. Мы объясняем, что делать бизнесу, а не пересказываем чужие пресс-релизы.",
    read: "читать",
    min: "мин",
    back: "Blog",
    missing: "Материал не найден",
    relatedTitle: "Ещё по теме",
    ctaTitle: "Нужно решение, а не статья",
    ctaCopy: "Разберём именно вашу задачу и предложим, с чего начать внедрение.",
    ctaButton: "Обсудить с AI Solution",
    clusterEmpty: "В этом кластере пока нет опубликованных статей.",
    authorPosts: "Публикации автора"
  },
  uz: {
    metaTitle: "AI Solution Blog — O'zbekistonda AI haqida kompaniya pozitsiyasi",
    metaDescription: "AI Solution blogi: biznes uchun AI joriy etish, savdo avtomatlashtiruvi va CRM bo'yicha kompaniya pozitsiyasi O'zbekiston va Markaziy Osiyoda.",
    navClusters: "Mavzular",
    navFeed: "Postlar",
    navPosition: "Pozitsiya",
    heroKicker: "AISOLUTION brief / zerikarli press-relizsiz",
    heroTitle: "Mintaqadagi AI. Boshqalarning yangiligi emas, bizning pozitsiyamiz.",
    heroCopy: "Qisqa va aniq: AI joriy etish, savdo, CRM va Markaziy Osiyo bozori haqida fikrimiz — har bir materialda shaxsiy tezis bilan.",
    heroCta: "Materiallarni ochish",
    heroSecondary: "Bizning pozitsiya",
    clustersKicker: "pozitsiyamiz bor mavzular",
    clustersTitle: "Mavzular, rukn uchun rukn emas",
    clustersCopy: "Har bir maqola bitta mavzuga bog'langan — shu sabab o'z vazifangizga mos materialni topish oson.",
    feedKicker: "yangi postlar",
    feedTitle: "AI Solution materiallari",
    feedCopy: "Tezis, argument, amaliy misol, xulosa. Boshqalarning yangiligini ko'chirmasdan.",
    filtersAll: "Barchasi",
    positionKicker: "SEO, lekin insoncha",
    positionTitle: "Bu yangiliklar lentasi emas. AI Solutionning ommaviy pozitsiyasi.",
    positionCopy: "Har bir post — kompaniya nuqtai nazari, rerayt emas. Biznes nima qilishi kerakligini tushuntiramiz, boshqalarning press-relizini qaytarmaymiz.",
    read: "o'qish",
    min: "daq",
    back: "Blog",
    missing: "Post topilmadi",
    relatedTitle: "Shu mavzuda yana",
    ctaTitle: "Maqola emas, yechim kerak",
    ctaCopy: "Aynan sizning vazifangizni ko'rib chiqamiz va nimadan boshlashni taklif qilamiz.",
    ctaButton: "AI Solution bilan muhokama qilish",
    clusterEmpty: "Bu klasterda hali chop etilgan maqolalar yo'q.",
    authorPosts: "Muallif materiallari"
  }
} satisfies Record<Locale, Record<string, string>>;

export function getLocale(value?: string): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
