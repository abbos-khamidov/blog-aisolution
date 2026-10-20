# Admin panel (`/admin`)

Maqolalarni git'siz qo'shish, tahrirlash va yashirish uchun yopiq panel.

## Yoqish (serverda, bir marta)

1. Parol xeshini yarating (parol kamida 12 belgi):
   ```bash
   npm run admin:hash -- "sizning-uzun-parolingiz"
   ```
2. Tasodifiy sessiya kaliti:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. Serverdagi `.env.local` (yoki PM2 env) ga qo'shing:
   ```
   ADMIN_PASSWORD_HASH=scrypt$16384$...
   ADMIN_SESSION_SECRET=...
   ```
4. `pm2 reload blog` — tayyor. Kirish: `https://blog.aisolution.uz/admin`.

Bu ikki o'zgaruvchi bo'lmasa, panel va API butunlay o'chiq (503).

## Xavfsizlik

- Parol faqat scrypt xesh ko'rinishida saqlanadi; kodda/gitda parol yo'q.
- Sessiya: HMAC imzoli cookie, `HttpOnly`, `Secure`, `SameSite=Strict`, 8 soat.
- 5 marta xato parol → shu IP 15 daqiqa bloklanadi.
- Yozish so'rovlarida Origin tekshiriladi (CSRF).
- `/admin` va `/api/admin` — `noindex`, `no-store`, `X-Frame-Options: DENY`, robots.txt'da yopiq.
- Ixtiyoriy qo'shimcha himoya — Nginx'da faqat ofis IP'siga ruxsat:
  ```nginx
  location /admin { allow 1.2.3.4; deny all; proxy_pass http://127.0.0.1:3002; }
  location /api/admin { allow 1.2.3.4; deny all; proxy_pass http://127.0.0.1:3002; }
  ```

## Qanday ishlaydi

- Admin'dan yozilgan maqolalar `data/posts/{uz|ru}/{slug}.mdx` ga tushadi (git'ga kirmaydi).
  **`data/` papkasi serverda saqlanib qolishi kerak** — deploy paytida o'chirilmasin, zaxira qiling.
- Git'dagi maqolani tahrirlasangiz, admin nusxasi yaratiladi va u ustun turadi.
  Admin nusxasini o'chirsangiz — git'dagi asl maqola qaytadi. Git maqolasini paneldan o'chirib bo'lmaydi,
  faqat «Qoralama» qilib yashirish mumkin.
- Saqlangandan keyin sayt keshi darhol yangilanadi.
- Yangi maqola bo'yicha push-bildirishnomalar hozircha faqat `deploy.sh` (`notify:new-posts`) orqali yuboriladi.

## Qulayliklar

- Ro'yxat: qidiruv, til (UZ/RU) va holat (Saytda / Qoralama / Paneldan) filtrlari, har maqolada «Saytda ↔ Yashirin» tugmasi.
- Muharrir: formatlash tugmalari (H2, qalin, havola, ro'yxat, iqtibos…), «Yonma-yon» jonli ko'rinish,
  so'z soni va o'qish vaqti, muqovani rasmdan tanlash.
- Klaviatura: Ctrl+S saqlash, Ctrl+B qalin, Ctrl+I kursiv, Ctrl+K havola.
- Saqlanmagan o'zgarish bo'lsa, sahifadan chiqishda ogohlantiradi. Xatolar o'zbekcha, qaysi maydon ekanini ko'rsatadi.

## API

| Metod | Yo'l | Vazifa |
|---|---|---|
| POST | `/api/admin/login` | `{ password }` → sessiya cookie |
| POST | `/api/admin/logout` | chiqish |
| GET | `/api/admin/posts` | barcha maqolalar ro'yxati |
| POST | `/api/admin/posts` | yangi maqola |
| GET/PUT/DELETE | `/api/admin/posts/{locale}/{slug}` | o'qish / saqlash / admin nusxasini o'chirish |
| PATCH | `/api/admin/posts/{locale}/{slug}` | `{ draft }` — ro'yxatdan tez yashirish / chiqarish |
