# Analitika: Google Analytics 4 + Yandex Metrika

Ikkalasi ham **standart holatda o'chiq**: ID berilmaguncha sahifaga hech qanday
skript qo'shilmaydi va CSP o'zgarmaydi. Kod: `lib/analytics-config.mjs`,
`lib/analytics.ts`, `components/Analytics.tsx`.

## Yoqish (serverda)

1. ID'larni oling:
   - **GA4:** analytics.google.com → Admin → Data streams → Web → `blog.aisolution.uz`
     → *Measurement ID* (`G-XXXXXXXXXX`). *Enhanced measurement* yoqilgan bo'lsin
     (sahifadan sahifaga o'tishlarni shu sanaydi).
   - **Yandex Metrika:** metrika.yandex.ru → schyotchik qo'shish → `blog.aisolution.uz`
     → raqamli ID (`12345678`).
2. `/var/www/blog/.env.production` ga qo'shing:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_YM_ID=12345678
   ```
   Bittasini qoldirib ketsa ham bo'ladi — faqat ID'si borlari yoqiladi.
3. `./deploy.sh` — ID'lar **build vaqtida** o'qiladi, shuning uchun qayta build shart.

## Tekshirish

- Sahifa kodida `googletagmanager.com/gtag/js?id=G-...` va `ym-init` bo'lishi kerak.
- GA4 → Reports → *Realtime*, Metrika → *Отчёты → Посещаемость* — bir necha daqiqada tashrif ko'rinadi.

## Eslatmalar

- Yandex **Webvisor** (seans yozib olish) ataylab o'chiq.
- Admin panel (`/admin`) kuzatilmaydi.
- Noto'g'ri formatdagi ID e'tiborsiz qoldiriladi (sahifaga kod tushib qolmasligi uchun).
