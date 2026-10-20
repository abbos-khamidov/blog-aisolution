# Redesign Notes — "Live" (AISOLUTION lime)

Companion to [`REDESIGN_BRIEF.md`](./REDESIGN_BRIEF.md). Replaces the earlier
"blue glass" pass. Same stack as before: Next.js 15 App Router, TypeScript,
plain CSS (`app/globals.css`), no new npm packages.

## Direction

Expert media surface, not a news feed. Graphite night sky, AISOLUTION brand
lime `#D8FF2C` only where the eye should go (main buttons, "годно" scores,
the best razbor), soft violet `#9D90FF` as the second voice, white text and
tiles. Light theme is designed separately: white canvas, dark text, lime
buttons, darker green `#4A7000` for lime-colored text so it stays readable.

Fonts: **Onest** (headings + body, has Cyrillic for `ru`) and **JetBrains Mono**
(labels, dates, scores), both via `next/font/google`.

## What's new

| Area | Change |
|---|---|
| Hero | `components/live/ScoreBoard.tsx` — every razbor is a 3D tower, height = score, best one in the centre glows lime; opinion columns lie flat in violet. Drawn on canvas with an affine projection (no CSS-3D blur), tilts toward the mouse, hover lifts, click opens the article. Starry sky with a shooting star every 3 s (`StarSky.tsx`). |
| Moving letters | `MotionHeading.tsx` — headings rise letter by letter (hero on load, others on scroll). Text is server-rendered and fully visible without JS. |
| Section backgrounds | `SectionScenes.tsx`: noise → signal (statement), analysis core with tracking frames on rated startups, score rain (verdicts), broadcast rings (subscribe). |
| Verdicts | `VerdictBoard.tsx` replaces the feed grid: ranked list, bar = score, 7.5 mark, colors by verdict, count-up numbers; filter pills (same rules as the old `?filter=` pills), search, like/save, "Saved" filter. Opinion columns grouped below without a score. |
| Method, clusters, numbers, FAQ, position band, subscribe | New sections; numbers and distribution tiles come from real ratings. |
| Header | `LiveStats.tsx` + `app/api/stats/route.ts` + `lib/live-stats.ts`: people online now + all-time unique visitors. Anonymous random id in localStorage, ping every 25 s, stored in `data/live-stats.json` (same git-ignored folder as push subscriptions, shared by both PM2 instances). |
| Comments | Removed (component, hook, storage helpers, texts, tests). Likes and bookmarks stay. |

Every canvas pauses when off screen and draws one still frame when the reader
has "reduce motion" turned on.

## Validation

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| Unit tests (7 files, 42 tests) | all pass, incl. new `lib/live-stats.test.ts` |
| Pages rendered (home ru/uz, article ru/uz, rating, opinion, saved, cluster, author, 404) in dark, light and 390 px | 0 runtime errors, 0 hydration mismatches, no horizontal scroll |
| `next build` | not run here (npm registry blocked in the review sandbox) — run `npm ci && npm run build` before deploying |
