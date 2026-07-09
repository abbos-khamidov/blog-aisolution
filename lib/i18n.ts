export const locales = ["ru", "uz"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const dictionary = {
  ru: {
    navRadar: "Радар",
    navFeed: "Материалы",
    navPosition: "Позиция",
    heroKicker: "blog.aisolution.uz / редакция без галстука",
    heroTitle: "AI-рынок, CRM и конкуренты. Разбираем вслух, без сахарной пудры.",
    heroCopy: "Публикуем новости, нашу точку зрения, свежие лица и разборы продуктов. Так, чтобы AISOLUTION искали, цитировали и находили в любом написании.",
    heroCta: "Читать ленту",
    heroSecondary: "Зачем это нам",
    radarKicker: "редакционный радар",
    radarTitle: "Что отслеживаем",
    radarOneTitle: "Новинки конкурентов",
    radarOneCopy: "Не ревнуем. Смотрим, что реально усиливает клиента, а что просто красиво шумит в презентации.",
    radarTwoTitle: "AI и CRM",
    radarTwoCopy: "Пишем про автоматизацию продаж, аналитику, контроль качества и все, что делает бизнес быстрее.",
    radarThreeTitle: "Новые лица",
    radarThreeCopy: "Подсвечиваем инженеров, предпринимателей и команды, которые двигают рынок вперед.",
    feedKicker: "свежие публикации",
    feedTitle: "Лента AISOLUTION",
    filtersAll: "Все",
    filtersRadar: "Радар",
    filtersFaces: "Лица",
    positionKicker: "SEO, но по-человечески",
    positionTitle: "Нам нужен не просто блог. Нам нужна публичная память бренда.",
    positionCopy: "Каждая публикация усиливает связку AISOLUTION / AI Solution / aisolutions: больше точек входа, больше экспертности, больше поводов появляться в поиске, картинках и ссылках сразу после основного сайта и CRM.",
    read: "читать",
    min: "мин",
    back: "Blog",
    missing: "Материал не найден"
  },
  uz: {
    navRadar: "Radar",
    navFeed: "Postlar",
    navPosition: "Pozitsiya",
    heroKicker: "blog.aisolution.uz / galstuksiz tahririyat",
    heroTitle: "AI bozori, CRM va raqobatchilar. Ochig'ini aytamiz, bezaksiz.",
    heroCopy: "Yangiliklar, o'z pozitsiyamiz, yangi yuzlar va mahsulot tahlillarini chiqaramiz. AISOLUTION har qanday yozilishda topilishi uchun.",
    heroCta: "Lentani o'qish",
    heroSecondary: "Bu nima uchun",
    radarKicker: "tahririyat radari",
    radarTitle: "Nimani kuzatamiz",
    radarOneTitle: "Raqobatchilar yangiliklari",
    radarOneCopy: "Rashk qilmaymiz. Mijozni kuchaytiradigan narsa bilan prezentatsiyada shovqin qiladigan narsani ajratamiz.",
    radarTwoTitle: "AI va CRM",
    radarTwoCopy: "Savdo avtomatlashtiruvi, analitika, sifat nazorati va biznesni tezlashtiradigan narsalar haqida yozamiz.",
    radarThreeTitle: "Yangi yuzlar",
    radarThreeCopy: "Bozorni oldinga siljitayotgan muhandislar, tadbirkorlar va jamoalarni ko'rsatamiz.",
    feedKicker: "yangi postlar",
    feedTitle: "AISOLUTION lentasi",
    filtersAll: "Barchasi",
    filtersRadar: "Radar",
    filtersFaces: "Yuzlar",
    positionKicker: "SEO, lekin insoncha",
    positionTitle: "Bizga shunchaki blog emas. Brendning ommaviy xotirasi kerak.",
    positionCopy: "Har bir post AISOLUTION / AI Solution / aisolutions bog'lanishini kuchaytiradi: ko'proq kirish nuqtalari, ko'proq ekspertlik, asosiy sayt va CRMdan keyin qidiruvda, rasmlarda va havolalarda ko'rinish uchun ko'proq sabab.",
    read: "o'qish",
    min: "daq",
    back: "Blog",
    missing: "Post topilmadi"
  }
} satisfies Record<Locale, Record<string, string>>;

export function getLocale(value?: string): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
