# Zero-Budget Browser Gaming Platform — Architecture & Build Plan

Oct 22, 2026 · @subhan

## Overview

We build a guest-only browser game portal on Next.js that costs $0 to run: no domain, no credit card, no paid service. Players open the site, pick a game, and play instantly; the only data we ever hold is an optional nickname and an anonymous ID.

Five decisions make the $0 budget work:

1. **Next.js as a static export** (`output: 'export'`), not server rendering. Cloudflare's free Workers plan caps a Worker at 3 MB gzipped, which a full Next.js server bundle often exceeds; static files have no such cap and are served free and unlimited.
2. **Cloudflare free tier for everything**: Pages for the app and the game files, one small Worker for the API, D1 for leaderboards, Turnstile for bot protection, Web Analytics for traffic.
3. **Games on their own origin** (a second Pages project), loaded in a sandboxed iframe, so third-party game code can never touch the portal.
4. **Guest-only identity**: a random ID in the browser, an optional nickname set once by the portal, saves kept on the player's device.
5. **Only free and legally licensed games**: our own, open-source with redistributable assets, or games whose developers gave written permission.

The catalog lives as a JSON file in the Git repo, so adding a game is a pull request, not a database operation. Free URLs look like `yourportal.pages.dev`; a custom domain is the first thing to buy if money ever appears (about $10 a year).

## Architecture

The portal and the games are static files on two separate Cloudflare Pages sites; the API Worker and D1 handle only leaderboards and scores.

&#91;embedded content: platform architecture · browser, 2 static sites, 1 Worker, 1 database\]

A game never talks to the network directly: it sends messages to the portal page, and the portal decides what reaches the Worker.

How a play session works:

1. The player opens `/play/neon-snake`; Pages serves pre-built HTML with the game's metadata.
2. The portal creates or reads the anonymous ID from IndexedDB and renders the sandboxed iframe pointing at the games site.
3. The game loads its files from the games site, calls `Portal.ready()`, then `Portal.load()` to restore any save.
4. On game over, the game calls `Portal.submitScore(1200)`. If the game needs a nickname and none is set, the portal shows the nickname dialog once.
5. The portal attaches a Turnstile token and posts to the API Worker, which validates it and upserts the best score into D1.
6. The leaderboard is fetched from the Worker and passed back to the game through the SDK.

## Tech stack

Every service below has a free tier that covers the MVP, and none of them needs a credit card except where noted.

| Layer | Choice | Free-tier limit that matters |
| --- | --- | --- |
| Framework | Next.js 15 App Router, TypeScript, `output: 'export'` | None; builds to static HTML/JS |
| UI | Tailwind CSS + shadcn/ui | None |
| App hosting | Cloudflare Pages (`yourportal.pages.dev`) | Static requests free and unlimited; 500 builds/month; 20,000 files, 25 MiB per file |
| Game hosting | Second Cloudflare Pages project (`yourportal-games.pages.dev`) | Same: 20,000 files, 25 MiB per file |
| API | One Cloudflare Worker using Hono (`api.yourname.workers.dev`) | 100,000 requests/day, 1,000/min burst; 3 MB gzipped script |
| Database | Cloudflare D1 (SQLite) | 5 GB storage; 5M row reads and 100,000 row writes per day |
| Bot protection | Cloudflare Turnstile | Free |
| Catalog search | Fuse.js in the browser over `catalog.json` | None |
| Saves | IndexedDB in the browser (via `idb-keyval`) | Device storage only |
| Analytics | Cloudflare Web Analytics | Free, no cookies |
| Error tracking | Sentry Developer plan | About 5,000 errors/month |
| Code + CI/CD | GitHub + GitHub Actions + Wrangler | 2,000 Actions minutes/month on private repos, unlimited on public |
| Emulation (Phase 4) | EmulatorJS (self-hosted files) | None |

Why not Next.js on Workers with OpenNext: it works, but the 3 MB free script limit and the 100,000 requests/day cap would apply to every page view. With a static export, page views never touch a Worker; only score submissions and leaderboard reads do.

Why not R2 yet: R2 has a free tier (10 GB, no egress fees), but activating it asks for a payment method. Pages serves game files just as well until a single file exceeds 25 MiB.

Sources: [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits), [Cloudflare free plan overview](https://dev.to/301st/every-job-your-vps-does-and-what-cloudflares-free-plan-does-with-it-5eao), [Pages free tier](https://temps.sh/blog/cloudflare-pages-free-tier-limits-2026).

## Repository and code contracts

One pnpm + Turborepo monorepo holds the app, the API, the game SDK and the games, so one pull request can add a game and its catalog entry together.

```text
portal/
  apps/
    web/                      Next.js static export -> Pages project 1
      app/
        page.tsx              home: featured, new, categories
        c/[category]/page.tsx category pages (generateStaticParams)
        play/[slug]/page.tsx  game page + sandboxed iframe
        about/ privacy/ dmca/ legal pages
      components/
        GameFrame.tsx         client component: iframe + postMessage bridge
        NicknameDialog.tsx    asks once, only when a game needs it
      lib/
        catalog.ts            reads content/catalog.json at build time
        player.ts             anonymous ID, nickname, saves (IndexedDB)
        api.ts                calls to the API Worker
      public/_headers         security headers for the app
  workers/
    api/                      Hono Worker + D1 -> api.yourname.workers.dev
      src/index.ts
      migrations/0001_init.sql
  games/                      Pages project 2 (one folder per game)
    _headers                  CSP, COOP/COEP, caching for games
    snake/v1/index.html
  packages/
    game-sdk/                 portal-sdk.js that every game includes
  content/
    catalog.json              the game catalog (source of truth)
```

**Catalog entry** (`content/catalog.json`), one object per game. Category pages, search and sitemaps are all generated from this file at build time.

```json
{
  "slug": "snake",
  "title": "Neon Snake",
  "version": "v1",
  "categories": ["arcade"],
  "thumbnail": "/thumbs/snake.webp",
  "description": "Classic snake with a neon twist.",
  "controls": ["keyboard", "touch"],
  "orientation": "any",
  "leaderboard": true,
  "maxScore": 100000,
  "needsNickname": true,
  "license": { "type": "MIT", "author": "Jane Dev", "source": "https://github.com/...", "permissionFile": "licenses/snake.txt" }
}
```

**Game SDK** (`portal-sdk.js`), the only way a game talks to the portal. Every call is a `postMessage` to the parent page, which validates it and does the real work.

| Call | What it does | Handled by |
| --- | --- | --- |
| `Portal.ready()` | Hides the loading screen | Parent page |
| `Portal.getPlayer()` | Returns `{ id, nickname }`; opens the nickname dialog if empty and the game needs one | Parent page |
| `Portal.save(data)` / `Portal.load()` | Stores up to 1 MB per game in IndexedDB under `save:<slug>` | Parent page |
| `Portal.submitScore(score)` | Sends score + Turnstile token to the API | Parent page, then API Worker |
| `Portal.getLeaderboard()` | Returns the top 50 for this game | API Worker |
| `Portal.gameplayStart()` / `gameplayStop()` | Pauses or resumes for future ads and analytics | Parent page |

The parent page checks `event.origin` equals the games origin before acting on any message, and only accepts messages from the iframe it created.

**API** (`workers/api`), three routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/scores` | Body `{ slug, playerId, nickname, score, turnstileToken }`; verifies Turnstile, checks score bounds, rate-limits per player |
| `GET` | `/leaderboard/:slug` | Top 50; sent with \`Cache-Control: max-age=60\` and held in Worker memory for 60 seconds (the edge Cache API is not available on \`workers.dev\`), so repeat reads rarely hit D1 |
| `GET` | `/health` | Uptime check |

**D1 schema** (`migrations/0001_init.sql`):

```sql
CREATE TABLE scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  player_id  TEXT NOT NULL,
  nickname   TEXT NOT NULL,
  score      INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_scores_board ON scores (slug, score DESC);
CREATE UNIQUE INDEX idx_scores_best ON scores (slug, player_id);
```

The unique index keeps one best score per player per game: a new score updates the row only if it is higher, which also keeps D1 writes low.

## Security and privacy rules

The portal never trusts game code and never collects more than a nickname; these rules enforce both in config, not just in policy.

**Iframe sandbox.** Every game loads as `<iframe src="https://yourportal-games.pages.dev/<slug>/<version>/index.html" sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen; gamepad; autoplay">`. `allow-same-origin` is safe here because the games project is a different site from the app (`pages.dev` is on the Public Suffix List). Never add `allow-top-navigation` or `allow-popups`.

**Games `_headers`** (in `games/_headers`):

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; frame-ancestors https://yourportal.pages.dev
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
  Cache-Control: public, max-age=31536000, immutable
```

`connect-src 'self'` stops any game from sending data to outside servers. `frame-ancestors` stops other sites from embedding your games. Versioned folders (`/v1/`, `/v2/`) make the year-long cache safe.

**App `_headers`**: `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` limited to fullscreen and gamepad, and a CSP allowing frames only from the games origin and scripts from self, Turnstile and Cloudflare Analytics. Do not set COEP on the app; it would break Turnstile.

**Data we store.** Browser: anonymous ID (`crypto.randomUUID()`), nickname, saves. Server (D1): game slug, anonymous ID, nickname, score, timestamp. Nothing else: no email, age, IP address or location is stored.

**Nicknames.** 3 to 16 characters, letters, digits and underscore only, checked against a profanity list (the `obscenity` npm package) in both the browser and the Worker.

**Score abuse.** Each submission must carry a valid Turnstile token (verified server-side); each game declares a `maxScore` in the catalog and the Worker rejects anything above it; one write per player per game per 10 seconds; the free WAF rate-limiting rule caps `/scores` per IP.

**Pages a $0 site still needs:** a privacy page (what is stored, how to clear it), a DMCA and takedown page with a contact email, and credits for every game's author and license.

## Game sourcing and licensing

Launch with 10 to 15 games from the first four sources below; each costs nothing but time, and none carries takedown risk if the checklist is followed.

| Source | How to get games | Effort | Risk |
| --- | --- | --- | --- |
| Your own games | Build small games in Phaser or Godot 4 (web export); 2 to 3 simple arcade games are enough to prove the SDK | High | None |
| Open-source HTML5 games | GitHub projects under MIT, Apache-2.0, GPL or similar, where the assets (art, sound, music) are also openly licensed (CC0, CC-BY) | Low | Low if assets are checked |
| Game jam entries | Email developers of jam games on itch.io; many grant free hosting in exchange for credit and a link | Medium | None with written permission |
| Indie developers | Offer free hosting, credit and future revenue share; get a one-page written agreement | Medium | None with agreement |
| Free game feeds (later) | Publisher programs such as GameDistribution or GamePix provide embeddable games with ads already inside and share revenue | Low | Low, but their ads and servers break the strict CSP; isolate them as a separate category |
| Homebrew / Freedoom (Phase 4) | Retro homebrew ROMs with author permission and Freedoom (fully free Doom-engine content) via EmulatorJS or js-dos | Low | None |

Never host: commercial ROMs or BIOS files, "bring your own game files" loaders for commercial games, ports of decompiled commercial engines (such as GTA reVC), or any trademarked game names, logos or art in your branding.

License checklist for every game, saved as `licenses/<slug>.txt` and linked from its catalog entry:

- [ ] Code license allows redistribution (and commercial use, if you will add ads)
- [ ] Every asset (sprites, music, sound, fonts) has its own redistributable license
- [ ] Required attribution is shown on the game page
- [ ] Written permission (email or agreement) saved, if the game is not openly licensed
- [ ] No third-party trademarks or characters in the game
- [ ] GPL games: source link published on the game page

## Phases

Seven phases take the portal from an empty repo to a public launch in week 8, then grow it; each phase ends with something deployed and playable.

&#91;embedded content: build roadmap · 7 phases, 3 gates\]

Timings assume one developer working part-time; a gate is passed only when its criteria are met, not when the weeks run out.

### Phase 0 · Foundations (week 1)

Goal: prove the whole pipeline with one real game. The day-by-day tasks are in the First week section below.

Done when: a stranger can open `yourportal.pages.dev/play/<slug>`, play the game, reload, and find their save.

### Phase 1 · Catalog MVP (weeks 2–3)

Goal: a portal that looks finished, with 10 legally sourced games.

- [ ] Home page: featured row, newest, categories grid, responsive game cards with WebP thumbnails
- [ ] Category pages generated from `catalog.json` with `generateStaticParams`
- [ ] Fuse.js search over title, category and description, entirely in the browser
- [ ] Game page: iframe, title, controls, author credit, license, related games
- [ ] Loading screen and a clear error state if a game fails to load
- [ ] Privacy, DMCA and credits pages
- [ ] 10 games deployed, each with a completed license checklist
- [ ] GitHub Actions: lint, type-check and `next build` on every pull request

Done when: all 10 games load and play on a mid-range Android phone and a desktop browser.

### Phase 2 · Player features (weeks 4–5)

Goal: the full SDK, so any game can use nickname and saves.

- [ ] Finish `portal-sdk.js` (all calls in the SDK table) and publish it in `packages/game-sdk` with a short README for game developers
- [ ] Nickname dialog with validation and profanity filter, shown only when `needsNickname` is true
- [ ] IndexedDB saves capped at 1 MB per game, with "clear my data" on the privacy page
- [ ] Fullscreen button, orientation hint, gamepad support passthrough
- [ ] Recently played row on the home page (stored locally)
- [ ] Integrate the SDK into all 10 games (a wrapper script works for games you cannot edit)

Done when: a game you did not write can save, load and read the nickname through the SDK alone.

### Phase 3 · Leaderboards (weeks 6–7)

Goal: secure, free leaderboards.

- [ ] Create the Worker with Hono and the D1 database with Wrangler; run `0001_init.sql`
- [ ] `POST /scores` with Turnstile verification, `maxScore` check, nickname check, 10-second per-player limit
- [ ] `GET /leaderboard/:slug` with in-memory caching and `Cache-Control`
- [ ] Free WAF rate-limiting rule on `/scores`
- [ ] Turnstile widget on the portal, invisible mode, token passed with each score
- [ ] SDK fallback: queue scores locally and show cached boards when the API is down
- [ ] Leaderboard panel on game pages

Done when: a forged score above `maxScore` is rejected, and turning the Worker off does not break any game.

**Gate: public launch** — every item in the launch checklist is ticked.

### Phase 4 · Launch and growth (weeks 8–10)

Goal: get the first players and learn what they play.

- [ ] `sitemap.xml`, `robots.txt`, per-game metadata and Open Graph images generated at build time
- [ ] Installable PWA (manifest + service worker caching the shell, not the games)
- [ ] Cloudflare Web Analytics dashboards: top games, bounce rate per game, mobile share
- [ ] Share buttons on game pages ("I scored 1,200 in Neon Snake")
- [ ] Post launches on Reddit (r/WebGames, r/IndieGaming), Discord communities and the developers' own channels
- [ ] Weekly review: drop or fix games with high bounce rates

Done when: you know your top 5 games and where players come from.

### Phase 5 · Catalog expansion (months 3–5)

Goal: grow to 50+ games without you doing all the uploading.

- [ ] Developer submission form (a GitHub issue template or a simple form) with license fields and permission upload
- [ ] Review checklist and a `games/` pull-request template for adding a game
- [ ] EmulatorJS category for homebrew ROMs with author permission; js-dos for Freedoom and other free DOS titles
- [ ] Ratings with thumbs up/down stored in D1 (one per anonymous ID per game)
- [ ] Daily featured game and simple tags (multiplayer, 2-player local, puzzle)

Done when: 50+ games are live and outside developers have submitted at least five.

**Gate: steady traffic** — about 1,000 daily players for a month before spending any money.

### Phase 6 · Sustainability (month 6+)

Goal: cover future costs from the platform itself.

- [ ] Add a monetized category from a game feed (GameDistribution or GamePix), isolated with its own CSP rules
- [ ] Optional display ads between game sessions using the SDK's `gameplayStart`/`gameplayStop` hooks
- [ ] Buy a custom domain once revenue covers it (about $10 a year)
- [ ] Upgrade to Workers Paid ($5/month) when the API nears 100,000 requests/day
- [ ] Move large games to R2; consider optional sign-in only if players ask for cross-device saves

Done when: monthly revenue exceeds monthly costs.

## Free-tier ceilings and when money is needed

Page views and game downloads are unlimited on this design, so the only ceiling that matters early is the API Worker's 100,000 requests per day.

| What runs out | Free limit | Roughly when | What happens | Fix |
| --- | --- | --- | --- | --- |
| API Worker requests | 100,000/day | About 10,000 daily players at 10 API calls each | Leaderboards and score saving stop until midnight UTC; games keep working | Batch calls, cache leaderboards longer; then Workers Paid ($5/month) |
| D1 writes | 100,000 rows/day | Rarely, thanks to best-score-only upserts | Score saving errors until reset | Skip writes when the score is not a new best |
| Pages file size | 25 MiB per file | First Unity or large Godot game | That game cannot be uploaded | Split assets, or move that game to R2 (needs a card on file) |
| Pages file count | 20,000 per project | Around 100 to 300 games, depending on files per game | Deploy fails | Second games project, or R2 |
| Pages builds | 500/month | Only with very frequent pushes | Deploys queue | Deploy from `main` only, not every branch |
| Sentry errors | About 5,000/month | One noisy bug | Errors stop being recorded | Sample client errors at 10 to 20% |

The API fails safe by design: if the Worker is over its limit, the SDK returns cached or empty leaderboards and queues the score locally, so players never see a broken game.

First three costs, in order, once the platform has traction: a custom domain (about $10 a year), Workers Paid at $5 a month (removes the daily request cap), then R2 storage for large games at cents per GB.

## First week and launch checklist

Day one ends with a blank Next.js page live on `pages.dev`; the week ends with one game playable end to end.

**First week**

- [ ] Day 1: Create free GitHub and Cloudflare accounts; create the monorepo; `create-next-app` with TypeScript, Tailwind, App Router; set `output: 'export'`; connect the repo to Cloudflare Pages and see it live
- [ ] Day 2: Write `content/catalog.json` with 3 placeholder entries; build the home grid and `/play/[slug]` with `generateStaticParams`
- [ ] Day 3: Create the second Pages project for `games/`; add `_headers`; deploy one open-source HTML5 game; embed it with `GameFrame`
- [ ] Day 4: Write `portal-sdk.js` with `ready`, `getPlayer`, `save`, `load`; wire the parent-side bridge with origin checks
- [ ] Day 5: Anonymous ID, nickname dialog with validation, IndexedDB saves; test that saves survive a reload
- [ ] Day 6: Test on a low-end Android phone and in Safari; fix touch controls and fullscreen
- [ ] Day 7: Write the privacy and DMCA pages; email 10 game developers asking for permission

**Before public launch**

- [ ] 10+ games live, each with a completed license checklist
- [ ] Lighthouse score above 90 on the home page (mobile)
- [ ] Every game page shows author, license and controls
- [ ] CSP verified: a test game that calls `fetch('https://example.com')` is blocked
- [ ] Turnstile and score bounds verified with a fake high score
- [ ] API outage simulated: games still load and play
- [ ] Cloudflare Web Analytics and Sentry receiving data
- [ ] Sitemap and Open Graph images generated for every game
- [ ] Privacy, DMCA and credits pages linked in the footer
