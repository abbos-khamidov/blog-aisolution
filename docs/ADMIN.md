# Admin panel (`/admin`)

Maqolalarni git'siz qo'shish, tahrirlash va yashirish uchun yopiq panel.

## Yoqish (serverda, bir marta)

Server `output: "standalone"` rejimida ishlaydi (`.next/standalone/server.js`, PM2 cluster).
Next.js standalone'ga faqat `.env` va `.env.production` fayllarini ko'chiradi — **`.env.local` ishlamaydi**.

1. Serverda, loyiha papkasida (`/var/www/blog`) parol xeshi va kalit yarating (parol kamida 12 belgi):
   ```bash
   cd /var/www/blog
   npm run admin:hash -- "sizning-uzun-parolingiz"
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
2. Ikkalasini `/var/www/blog/.env.production` fayliga yozing (fayl git'ga kirmaydi, `.gitignore` da `.env*`):
   ```
   ADMIN_PASSWORD_HASH=scrypt:16384:...
   ADMIN_SESSION_SECRET=...
   ```
   Fayl huquqi: `chmod 600 .env.production`.
3. `./deploy.sh` — build `.env.production` ni standalone'ga ko'chiradi va PM2'ni qayta ishga tushiradi.
4. Kirish: `https://blog.aisolution.uz/admin`.

Bu ikki o'zgaruvchi bo'lmasa, panel va API butunlay o'chiq (503).

### Ma'lumotlar qayerda

- Admin'dan yozilgan maqolalar: **`/var/www/blog/data/posts/{uz|ru}/{slug}.mdx`**.
  Standalone'da `process.cwd()` = `.next/standalone`, `next build` esa `.next/` ni har deploy'da tozalaydi —
  shuning uchun kod avtomatik ravishda `.next/standalone` dan tashqariga, `/var/www/blog/data` ga yozadi
  (`lib/data-dir.ts`). Boshqa joy kerak bo'lsa: `ADMIN_DATA_DIR=/mutlaq/yo'l` (`.env.production` da).
- `data/` git'ga kirmaydi va `git pull` / `npm ci` / `next build` unga tegmaydi. Zaxira nusxasini oling.
- PM2 2 nusxada ishlaydi: saqlangan nusxa darhol yangilanadi, ikkinchisi 1 daqiqa ichida (`revalidate = 60`).

> Eslatma (admin'ga aloqasi yo'q, mavjud kod): `lib/push.ts` ham `process.cwd()/data` ga yozadi, ya'ni
> standalone'da `.next/standalone/data/push-subscriptions.json` — bu fayl har deploy'da o'chadi, `npm run notify:new-posts`
> esa `/var/www/blog/data` dan o'qiydi. `lib/data-dir.ts` dagi `resolveDataDir()` ni u yerda ham ishlatish tavsiya etiladi.

## Xavfsizlik

Kodda:
- Parol faqat scrypt xesh ko'rinishida saqlanadi; kodda/gitda parol yo'q.
- Sessiya: HMAC imzoli cookie, `HttpOnly`, `Secure`, `SameSite=Strict`, 8 soat.
  Imzo kaliti parol xeshiga bog'langan — **parol almashtirilsa, hamma eski sessiyalar darhol bekor bo'ladi**.
- Parol tanlashdan himoya: bitta IP'dan 5 xato → 15 daqiqa blok; hamma IP'lardan jami 30 xato → 15 daqiqa umumiy blok.
  IP `X-Real-IP` dan olinadi (nginx yozadi, mijoz soxtalashtira olmaydi).
- Yozish so'rovlarida `Origin` = `Host` tekshiriladi (CSRF). `X-Forwarded-Host` ga ishonilmaydi.
- Maqola matnida HTML/JSX teglar (`<script>`, `<iframe>`…), `{ }` ifodalar va `javascript:`/`data:` havolalar rad etiladi;
  muqova/logo/xizmat havolasi faqat sayt ichidagi yo'l (`/covers/...`). MDX'ning `blockJS` himoyasi ham yoqilgan.
- `/admin` va `/api/admin` — `noindex`, `no-store`, `X-Frame-Options: DENY`, robots.txt'da yopiq.

Serverda (tavsiya, ustoz uchun):
1. Nginx'da login'ga tezlik chegarasi (`http {}` ichida bir marta, keyin `server {}` ichida):
   ```nginx
   limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;
   location = /api/admin/login {
       limit_req zone=admin_login burst=5 nodelay;
       proxy_pass http://127.0.0.1:3002;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
2. Eng kuchli himoya — `/admin` ni faqat ofis/VPN IP'siga ochish:
   ```nginx
   location /admin     { allow 1.2.3.4; deny all; proxy_pass http://127.0.0.1:3002; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
   location /api/admin { allow 1.2.3.4; deny all; proxy_pass http://127.0.0.1:3002; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
   ```
3. Parol kamida 16 belgi, tasodifiy (parol menejeridan). `.env.production` — `chmod 600`.
4. `npm audit` ni muntazam ko'rib turing (`npm ci` 11 ta zaiflik ko'rsatdi). `react`/`react-dom` hozir `19.1.0` —
   eng so'nggi `19.1.x` ga yangilash tavsiya etiladi (alohida PR).

## Qanday ishlaydi

- Admin'dan yozilgan maqolalar `data/posts/{uz|ru}/{slug}.mdx` ga tushadi (yuqoridagi «Ma'lumotlar qayerda»ga qarang).
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

## Yangi muqova rasmi qo'shish

Muqovalar `public/covers/*.png` da (asl nusxa — Telegram/Facebook preview uchun). Saytda esa ularning
yengil WebP nusxalari ko'rsatiladi: `public/covers/opt/<nom>-640.webp` (kartochka) va `-1280.webp` (maqola).
Yangi PNG qo'shgandan keyin bir marta:

```bash
npm run covers:optimize
```

Bu WebP'larni yasaydi va `lib/cover-variants.generated.ts` ni yangilaydi. Unutilsa ham sayt ishlaydi —
faqat o'sha muqova og'ir PNG bo'lib yuklanadi.
