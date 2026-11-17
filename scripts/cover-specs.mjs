/**
 * One entry per article cover, used by scripts/make-cover.mjs.
 * file     → public/covers/<file>.png (by convention the article slug)
 * title    → big line (short: brand or 2–3 words)
 * subtitle → one short line with the key fact
 * icon     → see `icons` in make-cover.mjs
 * eyebrow  → optional; defaults to the cluster label below
 */
export const eyebrows = {
  ru: { reviews: "Обзор", market: "Рынок", mnenie: "Мнение", founders: "Люди", education: "Обучение" },
  uz: { reviews: "Sharh", market: "Bozor", mnenie: "Fikr", founders: "Odamlar", education: "Ta'lim" }
};

const ru = (file, cluster, title, subtitle, icon) => ({ file, lang: "ru", cluster, title, subtitle, icon });
const uz = (file, cluster, title, subtitle, icon) => ({ file, lang: "uz", cluster, title, subtitle, icon });

// Theme hub fallbacks (lib/post-display.ts → clusterCoverImage), shown for both languages.
const hub = (file, cluster, title, subtitle, icon) => ({ file, lang: "ru", cluster, title, subtitle, icon, eyebrow: "Тема · Mavzu" });

export const coverSpecs = [
  hub("hub-education", "education", "AI EDUCATION", "обучение · ta'lim", "cap"),
  hub("hub-market", "market", "AI MARKET", "рынок · bozor", "candles"),
  hub("hub-reviews", "reviews", "AI REVIEWS", "обзоры · sharhlar", "magnifier"),
  hub("hub-founders", "founders", "FOUNDERS", "люди · asoschilar", "people"),
  hub("hub-opinion", "mnenie", "OPINION", "мнение · fikr", "quote"),

  // ---- reviews ----
  ru("cerberus-tech-ai-security-review", "reviews", "CERBERUS TECH", "AI-пентест · $8 · банки", "shield"),
  uz("cerberus-tech-ai-xavfsizlik-sharhi", "reviews", "CERBERUS TECH", "AI-pentest · $8 · banklar", "shield"),
  ru("repli-ai-review", "reviews", "REPLI AI", "продажи в Telegram · $375k", "chat"),
  uz("repli-ai-sharhi", "reviews", "REPLI AI", "Telegram'da savdo · $375k", "chat"),
  ru("unitlab-ai-review", "reviews", "UNITLAB AI", "разметка данных · $200k", "bbox"),
  uz("unitlab-ai-sharhi", "reviews", "UNITLAB AI", "ma'lumot belgilash · $200k", "bbox"),
  ru("tezcode-dev-ai-software-factory-razbor", "reviews", "TEZCODE.DEV", "AI Software Factory · Ташкент", "code"),
  uz("tezcode-dev-ai-software-factory-tahlil", "reviews", "TEZCODE.DEV", "AI Software Factory · Toshkent", "code"),
  ru("ai-office-12-agentov-po-otdelam", "reviews", "AI OFFICE", "12 AI-агентов по отделам", "nodes"),
  ru("ai-software-factory-gotovyj-produkt-kastom-nadstrojka", "reviews", "SOFTWARE FACTORY", "продукт · кастом · надстройка", "gear"),
  ru("zukko-ai-review", "reviews", "ZUKKO.AI", "проверяем по фактам", "magnifier"),
  ru("chatgpt-claude-v-uzbekistane-dostup-oplata-riski", "reviews", "CHATGPT И CLAUDE", "доступ · оплата · риски", "spark"),
  ru("pochemu-piloty-ii-ostayutsya-prezentaciey", "reviews", "ПИЛОТЫ ИИ", "почему остаются презентацией", "slides"),
  ru("vnedrenie-ii-otdel-prodazh", "reviews", "ИИ В ПРОДАЖАХ", "с чего начинать бизнесу", "funnel"),
  uz("sunaiy-intellekt-savdo-bolimida", "reviews", "SAVDODA AI", "nimadan boshlash kerak", "funnel"),

  // ---- market ----
  ru("it-park-ventures-30-million-ai-8-percent", "market", "IT PARK VC", "$30 млн · на AI только 8%", "bars"),
  uz("it-park-ventures-30-million-ga-osdi-ai-ga-8-foiz", "market", "IT PARK VC", "$30 mln · AI ga atigi 8%", "bars"),
  ru("rynok-ii-uzbekistan-2026-igroki-i-prognoz", "market", "РЫНОК ИИ 2026", "игроки · деньги · прогноз", "candles"),
  ru("ai-crm-market-pulse", "market", "AI CRM", "кто понял первым — забирает рынок", "contacts"),
  uz("ai-crm-endi-oyinchoq-emas-kim-birinchi-tushunsa-bozor-oshaniki", "market", "AI CRM", "kim birinchi tushunsa — bozor o'shaniki", "contacts"),
  ru("iflytek-tashkent-open-platform-central-asia", "market", "IFLYTEK", "AI-платформа в Ташкенте", "layers"),
  uz("iflytek-toshkentda-ai-platforma-ochdi", "market", "IFLYTEK", "Toshkentda AI-platforma", "layers"),
  ru("president-tech-ai-award-2026-6-million", "market", "TECH AWARD 2026", "$6 млн · где искать", "trophy"),
  uz("president-tech-ai-award-2026-6-million-qayerdan-olish", "market", "TECH AWARD 2026", "$6 mln · qayerdan olish", "trophy"),
  ru("skolko-stoit-vnedrenie-ii-tashkent", "market", "ЦЕНА ВНЕДРЕНИЯ ИИ", "из чего складывается · Ташкент", "coins"),
  ru("uzbekistan-fastest-growing-startup-ecosystem-index", "market", "STARTUP INDEX", "самая быстрорастущая экосистема", "growth"),
  uz("ozbekiston-eng-tez-osayotgan-startup-ekotizimi", "market", "STARTUP INDEX", "eng tez o'sayotgan ekotizim", "growth"),
  ru("waic-2026-uzbek-ai-companies-shanghai", "market", "WAIC 2026", "Шанхай · контакты, а не флаг", "globe"),
  uz("waic-2026-ozbek-ai-kompaniyalari-shanxayda", "market", "WAIC 2026", "Shanxay · bayroq emas, aloqa", "globe"),

  // ---- education / founders ----
  ru("ai-obuchenie-v-tashkente-kto-lider-i-kuda-smotret", "education", "AI-ОБУЧЕНИЕ", "Ташкент · кто лидер", "cap"),
  uz("toshkentda-ai-talim-kim-lider-va-qayerga-qarash-kerak", "education", "AI TA'LIM", "Toshkent · kim lider", "cap"),
  ru("new-faces-ai-uzbekistan", "founders", "НОВЫЕ ЛИЦА AI", "кого слушать уже сейчас", "people"),
  uz("ozbekistonda-aining-yangi-yuzlari-hozirdan-kimni-tinglash-kerak", "founders", "AI YANGI YUZLARI", "hozirdan kimni tinglash kerak", "people"),

  // ---- mnenie ----
  ru("kontrol-kachestva-zvonkov-ai", "mnenie", "КОНТРОЛЬ ЗВОНКОВ", "ручная выборка или анализ всех звонков", "wave"),
  uz("qongiroqlar-sifati-nazorati-ai", "mnenie", "QO'NG'IROQ NAZORATI", "qo'lda tanlash yoki barcha qo'ng'iroq tahlili", "wave"),
  ru("pochemu-slivayutsya-lidy", "mnenie", "СЛИВ ЛИДОВ", "скорость ответа · дисциплина лидов", "leak"),
  uz("lidlar-nega-yoqoladi", "mnenie", "YO'QOLGAN LIDLAR", "javob tezligi · lid intizomi", "leak"),
  ru("kak-otdelit-mnenie-ot-rejtinga", "mnenie", "МНЕНИЕ ≠ РЕЙТИНГ", "где проходит граница", "quote"),
  uz("fikrni-reytingdan-qanday-ajratish-kerak", "mnenie", "FIKR ≠ REYTING", "chegara qayerda", "quote"),
  ru("pochemu-ocenki-startapov-dolzhny-byt-zhestkimi", "mnenie", "ЖЁСТКИЕ ОЦЕНКИ", "почему без реверансов", "gauge"),
  uz("nega-startap-baholari-qattiq-bolishi-kerak", "mnenie", "QATTIQ BAHOLAR", "nega xushomadsiz", "gauge"),
  ru("kto-otvechaet-za-dejstvie-ii", "mnenie", "КТО ОТВЕЧАЕТ ЗА ИИ", "подтверждение · журнал · доступы", "checklist"),
  ru("kto-takie-aisolution-i-pochemu-oni-vezde", "mnenie", "AISOLUTION", "кто мы и почему мы везде", "orbit"),
  uz("aisolution-kim-va-nega-ular-hamma-joyda", "mnenie", "AISOLUTION", "kimmiz va nega hamma joydamiz", "orbit"),
  ru("competitor-watch-ai-tools", "mnenie", "СНОВА РЕЛИЗ", "вопрос не в кнопке", "cursor"),
  uz("raqobatchilarda-yana-reliz-yaxshi-lekin-masala-tugmada-emas", "mnenie", "YANA RELIZ", "masala tugmada emas", "cursor"),
  ru("uzbekistan-ai-law-deepfake-data", "mnenie", "ЗАКОН ОБ ИИ", "дипфейки · данные · не хайп", "scales"),
  uz("ozbekiston-aini-tartibga-solyapti-nihoyat-masala-hype-emas-data", "mnenie", "AI QONUNI", "deepfake · data · hype emas", "scales"),
  ru("kazakhstan-ai-economy-real-time-state", "mnenie", "KAZAKHSTAN AI", "экономика на ИИ · покажите процессы", "flow"),
  uz("qozogiston-ai-iqtisodiyotini-xohlaydi-yaxshi-endi-jarayonlarni-korsating", "mnenie", "QOZOG'ISTON AI", "jarayonlarni ko'rsating", "flow"),
  ru("kazakhstan-alem-ai-center", "mnenie", "ALEM.AI", "витрина должна стать цехом", "factory"),
  uz("alem-ai-qozogiston-ai-vitrinasini-quryapti-vitrina-sexga-aylanishi-kerak", "mnenie", "ALEM.AI", "vitrina sexga aylanishi kerak", "factory"),
  ru("armenia-yerevan-dialogue-ai-hybrid-threats", "mnenie", "ARMENIA · AI", "ИИ и гибридные угрозы", "radar"),
  uz("armaniston-ai-va-hybrid-threatlarni-muhokama-qilyapti-bu-akademiya-emas-yashab-qolish", "mnenie", "ARMANISTON · AI", "AI va gibrid tahdidlar", "radar"),
  ru("azerbaijan-digital-transport-ai", "mnenie", "БАКУ · ТРАНСПОРТ", "начните с грязных данных", "route"),
  uz("boku-transportda-aiga-qarayapti-yaxshi-kir-datadan-boshlang", "mnenie", "BOKU · TRANSPORT", "kir datadan boshlang", "route"),
  ru("azerbaijan-israel-ai-mou", "mnenie", "AZ × IL AI", "меморандум — это стек, не дружба", "rings"),
  uz("ozarbayjon-va-isroil-ai-memorandumi-imzoladi-bu-dostlik-emas-stack", "mnenie", "AZ × IL AI", "do'stlik emas, stack", "rings")
];
