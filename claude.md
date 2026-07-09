# CLAUDE.md — blog.aisolution.uz

## Кто ты

Ты — Claude Code, работающий над проектом `aisolution-blog`.
Собеседник — Аббос Хамидов (Adams Midov), founder & CEO AI Solution, senior backend.
Тон: инженер-инженеру. Не объясняй основы. Не пиши мотивационные преамбулы.
Формат ответа: 1. Что сделал 2. Ключевые решения 3. Что осталось.

---

## Контекст проекта

**Что это.** Отдельный поддомен `blog.aisolution.uz` — экспертный блог AI Solution.
Формат: **мнение компании**, не новостная лента. Каждая статья — позиция AI Solution
по теме ИИ в Узбекистане и Центральной Азии.

**Цель.** Локальное доминирование в выдаче `google.co.uz` по категорийным запросам
(«внедрение ИИ в Ташкенте», «автоматизация продаж ИИ Узбекистан», узбекоязычные аналоги)
и узнаваемость бренда AI Solution в ЦА.

**Кадэнс.** До 2 публикаций в день. Пишут ученики AI Solution + founder.
Авторство честное: под статьёй стоит имя того, кто её написал.

**Языки.** `ru` (основной) и `uz`. Полный hreflang.

---

## Жёсткие ограничения (не нарушать)

1. **`crm.aisolution.uz` не индексируется.** В Nginx-конфиге обязателен
   `add_header X-Robots-Tag "noindex, nofollow" always;` + `robots.txt` → `Disallow: /`.
   Это внутренняя система с append-only audit log и ownership enforcement.
   Индексация = утечка структуры API и login-эндпоинтов.

2. **Блог — отдельный PM2-процесс на отдельном порту.** Не трогать процесс `aisolution`.
   Трафик на блог не должен ронять CRM и основной сайт.

3. **`author` во фронтматтере = реальный автор.** Никакого фиктивного авторства.
   Ученик написал — стоит имя ученика с `affiliation: AI Solution`.

4. **Билд падает при невалидном фронтматтере.** zod-валидация на этапе `generateStaticParams`.
   Ученик не должен иметь возможности сломать schema.org.

5. **Не использовать `contentlayer`** (проект заброшен, ломается на Next 14).
   Только `gray-matter` + `next-mdx-remote/rsc`.

---

## Стек

| Слой | Технология |
|---|---|
| Framework | Next.js 14, App Router, `output: 'standalone'` |
| Контент | MDX-файлы в репе, PR-workflow |
| Парсинг | `gray-matter` + `next-mdx-remote/rsc` |
| Валидация | `zod` |
| Стили | Tailwind CSS |
| Подсветка кода | `rehype-pretty-code` (shiki) |
| Хостинг | Hetzner VPS `aisolution-main`, PM2, Nginx, certbot |
| Порт | `3001` (основной сайт занимает `3000`) |

---

## Структура проекта

```
aisolution-blog/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # html lang, hreflang, JSON-LD Organization
│   │   ├── page.tsx                # список статей, ISR revalidate 3600
│   │   ├── blog/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # статья, generateStaticParams, JSON-LD Article
│   │   ├── cluster/
│   │   │   └── [cluster]/page.tsx  # хаб кластера, перелинковка
│   │   └── authors/
│   │       └── [author]/page.tsx   # профиль автора, JSON-LD Person
│   ├── sitemap.ts
│   ├── robots.ts
│   └── globals.css
├── content/
│   ├── ru/
│   │   └── vnedrenie-ii-otdel-prodazh.mdx
│   └── uz/
│       └── sunaiy-intellekt-savdo-bolimida.mdx
├── lib/
│   ├── schema.ts                   # zod-схема фронтматтера
│   ├── content.ts                  # чтение и парсинг MDX
│   ├── jsonld.ts                   # генерация @graph
│   └── authors.ts                  # реестр авторов
├── components/
│   ├── mdx-components.tsx
│   ├── article-card.tsx
│   ├── cluster-nav.tsx
│   └── service-cta.tsx             # CTA-блок со ссылкой на услугу
├── scripts/
│   └── new-post.ts                 # CLI-скаффолд статьи для учеников
├── docs/
│   └── WRITING_GUIDE.md            # гайд для учеников
├── next.config.js
├── ecosystem.config.js             # PM2
└── deploy.sh
```

---

## Задача 1 — zod-схема фронтматтера

Файл: `lib/schema.ts`

Поля:

| Поле | Тип | Обязательное | Назначение |
|---|---|---|---|
| `title` | `string`, 20–70 симв. | да | `<title>`, `og:title` |
| `description` | `string`, 70–160 симв. | да | meta description |
| `slug` | `string`, kebab-case, regex | да | URL |
| `lang` | `'ru' \| 'uz'` | да | hreflang |
| `publishedAt` | ISO date | да | `datePublished` |
| `updatedAt` | ISO date | нет | `dateModified` |
| `author` | `string` (ключ из `lib/authors.ts`) | да | `Article.author` |
| `topicCluster` | enum | да | группировка + перелинковка |
| `keywords` | `string[]`, 1–8 | да | `Article.keywords` |
| `serviceLink` | `string` (path на aisolution.uz) | нет | CTA-блок |
| `translationOf` | `string` (slug на другом языке) | нет | связка hreflang |
| `cover` | `string` (путь в /public) | да | `og:image` |
| `draft` | `boolean`, default `false` | нет | исключение из билда и sitemap |

Enum `topicCluster`:
```
'vnedrenie'        // внедрение ИИ в бизнес
'prodazhi'         // ИИ в продажах и CRM
'integratsii'      // 1C, Битрикс24, OnlinePBX
'nlp-uz'           // узбекский язык, STT, NLP
'otrasli'          // отраслевые кейсы: стройка, ритейл, ювелирка
'ekonomika'        // стоимость, ROI, сроки
'obuchenie'        // ML, обучение, кадры
'mnenie'           // колонки, позиция AI Solution
```

Валидация вызывается при чтении каждого файла. При ошибке — `throw` с именем файла
и человекочитаемым списком проблем. Билд должен упасть.

---

## Задача 2 — реестр авторов

Файл: `lib/authors.ts`

```ts
export interface Author {
  key: string;            // 'abbas-khamidov'
  name: { ru: string; uz: string };
  role: { ru: string; uz: string };
  bio: { ru: string; uz: string };
  image: string;          // /authors/abbas.jpg
  sameAs: string[];       // LinkedIn, Threads, GitHub, Telegram
  isFounder: boolean;
}
```

Первый автор — `abbas-khamidov`, `isFounder: true`.
Ученики добавляются сюда же, `isFounder: false`, `affiliation` проставляется автоматически.

Без записи в реестре статья не собирается. Это защита от «автор: админ».

---

## Задача 3 — JSON-LD @graph

Файл: `lib/jsonld.ts`

Один `@graph` на страницу. Структура:

```jsonc
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://aisolution.uz/#organization",
      "name": "AI Solution",
      "url": "https://aisolution.uz",
      "logo": { "@type": "ImageObject", "url": "https://aisolution.uz/logo.png" },
      "sameAs": [
        "https://www.wikidata.org/wiki/Q140288424",
        "https://clutch.co/...",
        "https://www.crunchbase.com/...",
        "https://www.linkedin.com/company/..."
      ],
      "founder": { "@id": "https://aisolution.uz/about/abbas-khamidov#person" },
      "areaServed": [
        { "@type": "Country", "name": "Uzbekistan" },
        { "@type": "Place", "name": "Central Asia" }
      ]
    },
    {
      "@type": "Person",
      "@id": "https://aisolution.uz/about/abbas-khamidov#person",
      "name": "Аббос Хамидов",
      "alternateName": "Adams Midov",
      "jobTitle": "Founder & CEO",
      "worksFor": { "@id": "https://aisolution.uz/#organization" },
      "sameAs": ["..."]
    },
    {
      "@type": "WebSite",
      "@id": "https://blog.aisolution.uz/#website",
      "publisher": { "@id": "https://aisolution.uz/#organization" },
      "inLanguage": ["ru", "uz"]
    },
    {
      "@type": "BlogPosting",
      "@id": "https://blog.aisolution.uz/ru/blog/<slug>#article",
      "headline": "...",
      "author": { "@id": "https://aisolution.uz/about/<author>#person" },
      "publisher": { "@id": "https://aisolution.uz/#organization" },
      "isPartOf": { "@id": "https://blog.aisolution.uz/#website" },
      "datePublished": "...",
      "dateModified": "...",
      "keywords": ["..."],
      "inLanguage": "ru",
      "image": "..."
    },
    { "@type": "BreadcrumbList", "itemListElement": [/* ... */] }
  ]
}
```

**Критично:**
- `Organization.@id` и `Person.@id` живут на **основном домене**, не на блоге.
  Так Google склеивает сущности. Это и есть механика захвата брендовой выдачи.
- `author` каждой статьи резолвится в `Person` из реестра. Для учеников — свой `@id`
  вида `https://aisolution.uz/about/<key>#person` + `affiliation` на Organization.
- Одна `<script type="application/ld+json">` на страницу. Не плодить.

---

## Задача 4 — hreflang и i18n

- Локали: `ru` (default), `uz`.
- URL: `blog.aisolution.uz/ru/blog/<slug>`, `blog.aisolution.uz/uz/blog/<slug>`.
- Корень `/` → 308 на `/ru`.
- Связка переводов через `translationOf` во фронтматтере.
- В `<head>` каждой статьи:
  ```html
  <link rel="alternate" hreflang="ru" href="..." />
  <link rel="alternate" hreflang="uz" href="..." />
  <link rel="alternate" hreflang="x-default" href="<ru-версия>" />
  <link rel="canonical" href="<текущий URL>" />
  ```
- Если перевода нет — hreflang для него не выводится. Не ставить ссылку на 404.

---

## Задача 5 — кластеры и перелинковка

Каждая статья принадлежит одному `topicCluster`.

- `/[locale]/cluster/[cluster]` — хаб-страница кластера: заголовок, описание темы,
  список всех статей кластера. Индексируется.
- В конце каждой статьи — блок «Ещё по теме»: 3 статьи того же кластера,
  сортировка по `publishedAt desc`, исключая текущую.
- Хлебные крошки: `Блог → <Кластер> → <Статья>`, с `BreadcrumbList` в JSON-LD.

Это даёт внутренний граф без ручной работы: ученик указывает один enum — перелинковка
собирается сама.

---

## Задача 6 — CTA на услугу

Компонент `components/service-cta.tsx`.

Если во фронтматтере есть `serviceLink` — рендерить в конце статьи блок:
заголовок, одна строка описания, кнопка → `https://aisolution.uz{serviceLink}`.

Ссылка обычная `<a>`, `rel` не ставить (`nofollow` не нужен, это свой домен).
Именно эта ссылка превращает трафик в лиды. Без неё блог — просто текст.

---

## Задача 7 — sitemap и robots

`app/sitemap.ts`:
- все не-`draft` статьи, обе локали
- хабы кластеров
- страницы авторов
- `lastModified` = `updatedAt ?? publishedAt`
- `alternates.languages` для каждой записи

`app/robots.ts`:
- `allow: '/'`
- `sitemap: 'https://blog.aisolution.uz/sitemap.xml'`
- `host: 'blog.aisolution.uz'`

---

## Задача 8 — CLI-скаффолд для учеников

`scripts/new-post.ts`, запуск `npm run new-post`.

Интерактивно спрашивает: язык, заголовок, автор (список из реестра), кластер.
Генерирует `content/<lang>/<slug>.mdx` с заполненным фронтматтером и `draft: true`.
Slug транслитерируется из заголовка (ru → latin, uz → latin), kebab-case.

Цель: ученик не пишет фронтматтер руками и физически не может его сломать.

---

## Задача 9 — деплой

`ecosystem.config.js`:
```js
module.exports = {
  apps: [{
    name: 'aisolution-blog',
    script: '.next/standalone/server.js',
    cwd: '/var/www/aisolution-blog',
    env: { NODE_ENV: 'production', PORT: 3001, HOSTNAME: '127.0.0.1' },
    max_memory_restart: '400M',
    instances: 1,
    exec_mode: 'fork'
  }]
};
```

`deploy.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run build

# критично для standalone: статика не копируется автоматически
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

pm2 restart aisolution-blog --update-env
pm2 save
```

**Nginx** — два блока.

Блог:
```nginx
server {
    listen 443 ssl http2;
    server_name blog.aisolution.uz;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

CRM — обязательно:
```nginx
server {
    listen 443 ssl http2;
    server_name crm.aisolution.uz;

    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    location = /robots.txt {
        add_header Content-Type text/plain;
        return 200 "User-agent: *\nDisallow: /\n";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        # ... стандартные заголовки
    }
}
```

Сертификат: `certbot --nginx -d blog.aisolution.uz`.

---

## Задача 10 — гайд для учеников

`docs/WRITING_GUIDE.md`. Содержание:

**Что писать.** Мнение AI Solution по теме. Не пересказ новости — позиция.
Структура: тезис → аргумент → пример из практики → вывод. 700–1500 слов.

**Что нельзя:**
- копировать текст из других источников (цитата — до 15 слов, с атрибуцией)
- политика, госрегулирование, оценка действий властей
- цифры клиентских проектов без согласования с founder
- обещания результата («ИИ увеличит продажи на 300%»)
- статья без личного тезиса — это не блог, это рерайт

**Workflow:**
1. `npm run new-post`
2. пишешь в MDX
3. `draft: false`, `npm run build` — билд должен пройти локально
4. PR в `main`, ревью founder, мерж
5. `./deploy.sh` на сервере

**Чеклист перед PR:** заголовок ≤70, description 70–160, кластер выбран,
1–8 keywords, есть cover, есть личный тезис в первых двух абзацах.

---

## Порядок выполнения

Делай последовательно, коммить после каждого шага:

1. `next.config.js`, Tailwind, структура папок, `output: 'standalone'`
2. `lib/schema.ts` — zod, вместе с юнит-тестом на падение при невалидном фронтматтере
3. `lib/authors.ts` — реестр, запись `abbas-khamidov`
4. `lib/content.ts` — чтение MDX, фильтр `draft`, сортировка, выборка по кластеру
5. `lib/jsonld.ts` — `@graph`, чистые функции, покрыть тестом на валидность `@id`-ссылок
6. `app/[locale]/layout.tsx` — hreflang, canonical, Organization-граф
7. `app/[locale]/blog/[slug]/page.tsx` — `generateStaticParams`, `generateMetadata`, MDX-рендер
8. `app/[locale]/page.tsx` — список, ISR
9. `app/[locale]/cluster/[cluster]/page.tsx` + блок «Ещё по теме»
10. `app/[locale]/authors/[author]/page.tsx` — `Person`-граф
11. `components/service-cta.tsx`
12. `app/sitemap.ts`, `app/robots.ts`
13. `scripts/new-post.ts`
14. `ecosystem.config.js`, `deploy.sh`, Nginx-конфиги (оба, включая CRM)
15. `docs/WRITING_GUIDE.md`
16. Демо-статья на `ru` + её перевод на `uz`, проверить hreflang и `@graph`

После шага 5 — покажи мне `lib/jsonld.ts` до того, как двигаться дальше.
После шага 16 — прогони через `npx @schemaorg/validator` или выгрузи `@graph`
для ручной проверки в Rich Results Test.

---

## Definition of Done

- [ ] `npm run build` падает на невалидном фронтматтере с внятной ошибкой
- [ ] `@graph` валиден, все `@id` резолвятся, `Organization` на основном домене
- [ ] hreflang выводится только для существующих переводов
- [ ] `crm.aisolution.uz` отдаёт `X-Robots-Tag: noindex` и `Disallow: /`
- [ ] блог — процесс `aisolution-blog` на `:3001`, `aisolution` не тронут
- [ ] `deploy.sh` копирует `static` и `public` в `standalone`
- [ ] sitemap содержит обе локали с `alternates`
- [ ] ученик может создать статью через CLI, не открывая фронтматтер

---

## Чего не делать

- Не поднимать админку и БД. Контент — файлы в git.
- Не добавлять аналитику тяжелее Plausible/Umami.
- Не ставить комментарии. Дискуссия — в Telegram, не на сайте.
- Не создавать `/news` без `noindex`, если такой раздел вообще появится.
- Не менять schema.org-разметку на основном домене из этого проекта.