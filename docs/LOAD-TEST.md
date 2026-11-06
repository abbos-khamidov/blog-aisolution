# Yuklama testi (ko'p so'rov kelganda server qotmasligi)

## Natija (2026-10-27, bitta PM2 nusxasi, 1000 so'rovdan)

| Manzil | Oldin | Keyin |
|---|---|---|
| `POST /api/stats` | ~20 so'rov/s, 50 ta parallelda 133 ta timeout, 200 tada 996/1000 | ~600–700 so'rov/s, 1000 parallelda ham 0 xato |
| `/og-image.png` | 6 so'rov/s, p95 9 s | ~1200–1400 so'rov/s |
| `/favicon.ico` | ~140 so'rov/s | ~2000 so'rov/s |
| `/api/stats` yuklanganda oddiy so'rov | p50 5,4 s, ko'pi 15 s da ham javobsiz | p50 0,2 s |

### Har bir API (1000 so'rov, bitta PM2 nusxasi)

| API | 100 parallel | 1000 parallel |
|---|---|---|
| `POST /api/stats` | ~580 so'rov/s, 0 xato | ~510 so'rov/s, 0 xato |
| `POST /api/push/subscribe` | ~725 so'rov/s, 0 xato | ~725 so'rov/s, 0 xato |
| `POST /api/push/unsubscribe` | ~735 so'rov/s, 0 xato | ~800 so'rov/s, 0 xato |
| `GET /api/admin/*` (login'siz → 401) | ~1130 so'rov/s | ~910 so'rov/s |
| `POST /api/admin/login` hujumi paytida sayt | oldin max 1,1 s to'xtash | endi max ~80 ms |

Login: parol tekshiruvi (scrypt) endi asinxron — Node'ning thread pool'ida ishlaydi va saytni
to'xtatmaydi. Urinish tekshiruvdan oldin hisoblanadi: bitta IP'dan 100 ta parallel urinishdan
parol aynan 5 marta tekshiriladi, 95 tasi 429 bilan qaytadi.

**Sabab:** `/api/stats` (har ochiq tab 25 soniyada bir chaqiradi) har so'rovda butun
`live-stats.json` ni sinxron o'qib-yozardi (fayl o'sib boradi — 20 000 tashrifchida ~850 KB).
Shu vaqt Node.js boshqa hech qanday so'rovga (sahifalarga ham) javob bermasdi.
Next.js 15 da `GET` route'lar sukut bo'yicha har so'rovda qayta ishlaydi, shuning uchun
favicon va OG rasm har safar `sharp` bilan qayta yasalardi.

**Tuzatish:** hisoblagich xotirada, faylga 5 soniyada bir marta birlashtirib yoziladi
(`lib/live-stats.ts`); favicon/OG/RSS `force-static` — build paytida bir marta yasaladi.
Statistika fayli endi `/var/www/blog/data/` da (deploy'da o'chmaydi, `lib/data-dir.ts`).

## O'z kompyuteringizda sinash

```bash
npm run build
npm run start                       # http://localhost:3001
# ikkinchi terminalda:
node scripts/load-test.mjs http://localhost:3001/ru --steps 10,50,100,200 --requests 1000
node scripts/load-test.mjs http://localhost:3001/api/stats --stats --steps 10,50,100,200 --requests 1000
```

Har qadam uchun so'rov/s, p50/p95/p99 kutish vaqti va xatolar chiqadi. p95 2 soniyadan
oshsa yoki xato chiqsa — server o'sha yuklamada qiynalyapti.

## Haqiqiy saytda sinash

Faqat server egasining roziligi bilan, saytda odam kam paytda, kichik qadamlardan boshlab.
Og'ir test hosting provayderga hujumdek ko'rinadi. Skript buni so'raydi:

```bash
node scripts/load-test.mjs https://blog.aisolution.uz/ru --steps 10,50,100 --requests 300 --i-have-permission
```

## Himoya qatlamlari

1. **Kod** (bu PR):
   - `/api/stats` xotirada hisoblaydi (yuqoridagi jadval).
   - favicon / OG rasm / RSS — build'da bir marta yasaladi.
   - Maqolalar ro'yxati 10 soniya keshlanadi (`lib/content.ts`): mavjud bo'lmagan
     `/blog/<slug>` so'rovi oldin har safar 54 ta faylni o'qirdi (13 ms bloklash) — endi ~0 ms.
     Admin saqlaganda kesh darhol tozalanadi; ikkinchi PM2 nusxasi 10 s ichida yangilanadi.
2. **Nginx** (`deploy/nginx-blog.conf`) — eng katta yutuq:
   - ochiq sahifalar 10 soniyalik mikro-keshdan beriladi: 1000 kishi bir soniyada kirsa ham
     Node.js'ga 10 soniyada bitta so'rov boradi; Node sekinlashsa yoki o'chsa — oxirgi nusxa beriladi;
   - `/_next/static` va rasmlar nginx keshida;
   - IP bo'yicha tezlik chegarasi (CGNAT tufayli yumshoq: mobil operatorlar ko'p odamni bitta IP'dan chiqaradi);
   - Node bilan keep-alive ulanish; admin cookie'si bo'lsa kesh ishlatilmaydi.
3. **PM2** (`ecosystem.config.js`) — hozir 2 nusxa. Server yadrolari ko'p bo'lsa va xotira yetsa,
   `instances` ni yadro soniga yaqinlashtirish mumkin (har nusxa ~150–250 MB; serverda asosiy sayt va CRM ham bor).

### Nginx'ni qo'llash (server egasi)

Bu konfiguratsiya haqiqiy nginx'da hali sinalmagan — albatta avval tekshiring:

```bash
sudo cp /etc/nginx/sites-available/blog.aisolution.uz ~/blog-nginx.backup   # zaxira
sudo cp deploy/nginx-blog.conf /etc/nginx/sites-available/blog.aisolution.uz
sudo mkdir -p /var/cache/nginx/blog
sudo nginx -t                      # "syntax is ok" bo'lmasa — reload QILMANG, zaxirani qaytaring
sudo systemctl reload nginx
curl -sI https://blog.aisolution.uz/ru | grep -i x-cache    # 1-marta MISS, keyin HIT
```
