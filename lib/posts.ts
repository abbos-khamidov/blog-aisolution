import type { Locale } from "./i18n";

export type Localized<T> = Record<Locale, T>;

export type Post = {
  id: string;
  slug: string;
  status: "published" | "draft";
  category: string;
  accent: string;
  publishedAt: string;
  readMinutes: number;
  cover: string;
  title: Localized<string>;
  excerpt: Localized<string>;
  body: Localized<string[]>;
  tags: string[];
};

export const posts: Post[] = [
  {
    id: "ai-crm-market-pulse",
    slug: "ai-crm-market-pulse",
    status: "published",
    category: "CRM",
    accent: "#00d2ff",
    publishedAt: "2026-07-09",
    readMinutes: 4,
    cover: "/images/aisolution-blog-hero.png",
    title: {
      ru: "AI CRM больше не игрушка. Кто понял первым, тот забирает рынок",
      uz: "AI CRM endi o'yinchoq emas. Kim birinchi tushunsa, bozor o'shaniki"
    },
    excerpt: {
      ru: "Разбираем, почему обычная CRM превращается в операционный мозг продаж, и где конкуренты все еще делают вид, что достаточно красивой таблички.",
      uz: "Oddiy CRM qanday qilib savdo operatsion miyasiga aylanayotganini va raqobatchilar qayerda hali ham chiroyli jadval yetarli deb o'ylayotganini ko'ramiz."
    },
    body: {
      ru: [
        "Рынок привык называть CRM любой список лидов с кнопкой статуса. Это удобно продавать, но плохо помогает бизнесу. В 2026 году CRM должна не хранить хаос, а подсказывать, где теряются деньги, кто тормозит сделку и какой менеджер нуждается в контроле прямо сейчас.",
        "Наша позиция простая: AI в CRM ценен не как модная надпись, а как ежедневная дисциплина. Система должна видеть пропущенные звонки, слабые ответы, задержки по этапам и превращать это в действия.",
        "Конкуренты тоже двигаются. Кто-то добавляет чат-бота, кто-то рисует AI-кнопку в интерфейсе. Но если AI не встроен в процесс продаж, это просто декор. Бизнесу нужна скорость, ответственность и понятные цифры."
      ],
      uz: [
        "Bozor CRM deb status tugmasi bor har qanday lid ro'yxatini atashga o'rganib qolgan. Buni sotish oson, lekin biznesga kam yordam beradi. 2026 yilda CRM tartibsizlikni saqlamasligi, pul qayerda yo'qolayotganini va qaysi bitim sekinlashayotganini ko'rsatishi kerak.",
        "Bizning pozitsiyamiz oddiy: CRM ichidagi AI moda yozuvi emas, kundalik intizom bo'lishi kerak. Tizim o'tkazib yuborilgan qo'ng'iroqlarni, sust javoblarni, bosqichlardagi kechikishlarni ko'rib, ularni amaliy vazifalarga aylantirishi kerak.",
        "Raqobatchilar ham harakatda. Kimdir chatbot qo'shadi, kimdir interfeysga AI tugmasi chizadi. Ammo AI savdo jarayoniga kirmasa, bu faqat bezak. Biznesga tezlik, javobgarlik va aniq raqamlar kerak."
      ]
    },
    tags: ["aisolution", "ai solution", "crm", "sales", "uzbekistan"]
  },
  {
    id: "competitor-watch-ai-tools",
    slug: "competitor-watch-ai-tools",
    status: "published",
    category: "Радар",
    accent: "#ff6b35",
    publishedAt: "2026-07-08",
    readMinutes: 3,
    cover: "/images/aisolution-blog-hero.png",
    title: {
      ru: "У конкурентов снова релиз. Хорошо, но вопрос не в кнопке",
      uz: "Raqobatchilarda yana reliz. Yaxshi, lekin masala tugmada emas"
    },
    excerpt: {
      ru: "Следим за новинками рынка без ревности: что полезно, что шум, и почему клиенты покупают результат, а не скриншот.",
      uz: "Bozor yangiliklarini xotirjam kuzatamiz: nimasi foydali, nimasi shovqin va nega mijozlar skrinshotni emas, natijani sotib oladi."
    },
    body: {
      ru: [
        "Любой релиз конкурента полезен: он показывает, куда рынок смотрит и чего клиенты уже ждут по умолчанию. Но мы не верим в гонку кнопок. Если функция не меняет экономику клиента, она быстро превращается в пункт презентации.",
        "Правильный вопрос звучит жестче: стало ли меньше ручной работы, выросла ли конверсия, быстрее ли руководитель видит проблему. Если нет, релиз красивый, но пустой.",
        "В AISOLUTION мы будем разбирать такие новости спокойно и прямо. Хвалить то, что реально сильное. Критиковать то, что продается как прорыв, но работает как косметика."
      ],
      uz: [
        "Har bir raqobatchi relizi foydali: u bozor qayerga qarayotganini va mijozlar nimani odatiy deb kutayotganini ko'rsatadi. Lekin biz tugmalar poygasiga ishonmaymiz. Funksiya mijoz iqtisodiyotini o'zgartirmasa, u tezda prezentatsiya bandiga aylanadi.",
        "To'g'ri savol aniqroq: qo'l mehnati kamaydimi, konversiya oshdimi, rahbar muammoni tezroq ko'ryaptimi. Agar yo'q bo'lsa, reliz chiroyli, lekin bo'sh.",
        "AISOLUTION blogida bunday yangiliklarni xotirjam va to'g'ri tahlil qilamiz. Haqiqatan kuchli narsani maqtaymiz. Proryv deb sotilayotgan, ammo kosmetika bo'lib qolgan narsani tanqid qilamiz."
      ]
    },
    tags: ["competitors", "ai tools", "market"]
  },
  {
    id: "new-faces-ai-uzbekistan",
    slug: "new-faces-ai-uzbekistan",
    status: "published",
    category: "Лица",
    accent: "#1ed760",
    publishedAt: "2026-07-07",
    readMinutes: 5,
    cover: "/images/aisolution-blog-hero.png",
    title: {
      ru: "Новые лица AI в Узбекистане: кого стоит слушать уже сейчас",
      uz: "O'zbekistonda AIning yangi yuzlari: hozirdan kimni tinglash kerak"
    },
    excerpt: {
      ru: "Блог будет замечать не только продукты, но и людей: инженеров, предпринимателей, аналитиков и тех, кто делает рынок взрослее.",
      uz: "Blog faqat mahsulotlarni emas, odamlarni ham ko'radi: muhandislar, tadbirkorlar, tahlilchilar va bozorni ulg'aytirayotganlarni."
    },
    body: {
      ru: [
        "Экспертность строится не только на собственных релизах. Ее строит способность видеть рынок: кто делает сильные продукты, кто задает правильные вопросы, кто помогает бизнесу понимать AI без тумана.",
        "Поэтому в блоге AISOLUTION появится рубрика о новых лицах. Без пустого пафоса. С конкретикой: чем человек полезен рынку, что он строит, какие идеи стоит забрать в работу.",
        "Так формируется не просто трафик, а доверие. Когда люди ищут AISOLUTION, AI Solution или aisolutions, они должны видеть живую компанию с позицией, а не только лендинг."
      ],
      uz: [
        "Ekspertlik faqat o'z relizlari bilan qurilmaydi. U bozorni ko'ra olish bilan quriladi: kim kuchli mahsulot qilyapti, kim to'g'ri savollar beryapti, kim biznesga AIni aniq tushuntiryapti.",
        "Shu sabab AISOLUTION blogida yangi yuzlar rukni bo'ladi. Ortiqcha pafossiz. Aniq: inson bozorga nimasi bilan foydali, nima qurmoqda, qaysi g'oyalarni ishga olish mumkin.",
        "Shunday qilib faqat trafik emas, ishonch ham shakllanadi. Odamlar AISOLUTION, AI Solution yoki aisolutions deb qidirganda, faqat landing emas, pozitsiyasi bor tirik kompaniyani ko'rishi kerak."
      ]
    },
    tags: ["people", "ai uzbekistan", "expertise"]
  }
];

export function getPublishedPosts() {
  return posts
    .filter((post) => post.status === "published")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getPostBySlug(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
