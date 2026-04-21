# Project Overview

GameSage is a SvelteKit web app (LSU CSC 4330 class project) that transforms a user's Steam library into a clean, AI-powered gaming hub — surfacing personalized "play" recommendations, friend activity, and rich game detail. Target users are Steam gamers who want a smarter alternative to the default Steam UI.

---

# Architecture & Data Flow

```
Browser
  └── SvelteKit pages (src/routes/**/+page.svelte)
        └── lib/data.js        → writable Svelte store, persisted to LocalStorage (key: ldb-gamesage_0.0.10)
        └── lib/cache.js       → TTL-based Steam data loader; feeds db.cache; called from +layout.svelte onMount
        └── lib/algorithm.js   → Algorithm class; calls /api/sage; stores suggestions in db.cache.suggestions
        └── lib/auth.js        → Firebase Auth listener; writes fireuser into db.user
        └── lib/steam.js       → steamAPI object; every call goes through /api?endpoint=<url> (being rebuilt)

SvelteKit Server (src/routes/api/)
  └── /api/+server.js          → CURRENT: naive CORS proxy — passes any URL through (JANKY, needs full rebuild)
  └── /api/sage/+server.js     → AI recommendation endpoint; currently uses @anthropic-ai/sdk (migrate to rueter-ai)

External Services
  └── Steam Web API            → game library, player summaries, friends, recently played, store details
  └── HowLongToBeat API        → via hltbapi.codepotatoes.de (third-party, no key needed)
  └── Firebase (Google OAuth)  → authentication only; config hardcoded in lib/firebase.js
  └── Anthropic (Claude)       → game recommendations via rueter-ai npm package
```

**Key data flows:**
1. User loads app → `+layout.svelte` calls `startCacheUpdateCycle()` → fetches user summary, library list, recently played, and a batch of 4 game details per cycle (incremental, fills over sessions)
2. `algorithm.js` `getSuggestions()` → `buildCompactProfile()` (from cache) → POST `/api/sage` → Claude returns `{"s":[appid,...]}` → mapped to cached game detail objects → stored in `db.cache.suggestions` for 24h
3. All pages subscribe to the `db` store for reactive updates; `db` auto-persists to LocalStorage on every change

---

# Tech Stack

| Technology | Role |
|---|---|
| SvelteKit (Svelte 5) | Full-stack framework; SSR + client hydration; file-based routing |
| `rueter-ai` (npm, Aaron's package) | **All AI/LLM API calls** — `RueterModel("anthropic", key)` → setters → `await model.prompt(text)` returns string |
| Firebase Auth (Google OAuth only) | User authentication; config hardcoded in `lib/firebase.js` |
| LocalStorage | Primary data persistence; all app state lives in one JSON blob under `ldb-gamesage_0.0.10` |
| Steam Web API | Source of truth for library, playtime, friends, player summaries |
| Steam Store API | Game metadata (details, screenshots, descriptions) |
| HowLongToBeat API | Playtime estimates via `hltbapi.codepotatoes.de/steam/<appid>` |
| FontAwesome (CDN) | Icons, loaded via kit script in `<svelte:head>` |
| Figtree font | Self-hosted in `src/lib/Figtree/`; applied globally |
| rue-lang (npm, Aaron's package) | Optional CSS preprocessor; use `<style lang="rue">` in Svelte files; preprocessor wired in `svelte.config.js` and `vite.config.js`; feel free to skip it |
| Vite | Build tool via SvelteKit |
| Firebase Hosting | Deployment target (currently in development) |

**Language:** JavaScript only. Do not introduce TypeScript.

---

# Key Constraints & Requirements

**API system (top priority rebuild):**
- The current `/api/+server.js` is a single-endpoint CORS proxy that forwards any URL — it's janky, insecure (no input validation, Steam key leaked in URL), and has no rate limiting. **This must be fully rebuilt** into proper structured `/api/steam/[endpoint]/+server.js` routes.
- Steam API key **must** live in `.env` as `STEAM_API_KEY` (currently hardcoded in `steam.js` — fix this).
- `lib/steam.js` must be updated to call the new structured routes instead of the generic proxy.
- `data.js` has a `serverAPI` pointing to `simple-api-server.vercel.app` — this was a dev hack and should be removed/replaced.

**AI calls:**
- Use `rueter-ai` (`RueterModel`) for all LLM calls, including `/api/sage`. Migrate away from `@anthropic-ai/sdk`.
- Pattern: `new RueterModel("anthropic", ANTHROPIC_API_KEY)` → `model.setSystemPrompt()` → `model.setMaxTokens()` → `model.setTemperature()` → `const text = await model.prompt(userContent)` (returns plain string).
- `model` index param (3rd arg) defaults to 0 = `claude-haiku-4-5-20251001` for anthropic — fine for recommendations.
- `ANTHROPIC_API_KEY` goes in `.env`.

**Auth:**
- Firebase config is hardcoded in `lib/firebase.js` — this is acceptable per owner's preference, do not move to `.env`.
- Protected-route logic (redirect unauthenticated users to `/login`) is currently **absent** from `+layout.svelte` — needs implementing.

**Caching:**
- TTLs: user profile 1h, library list 6h, game details 7 days, recently played 15min, AI suggestions 24h.
- `DETAIL_BATCH_SIZE = 4` per cycle — keeps Steam API load low; library fills incrementally across sessions.

**JS only:** All source files are `.js`. Do not convert to `.ts`.

**No monetization yet:** Referral/affiliate system is aspirational. No approved referral status. Ads planned eventually. Do not implement revenue features.

**`/algorithm` route:** Dev/debug page, open and unrestricted. Not a priority; do not develop it.

---

# Required `.env` Variables

```env
STEAM_API_KEY=your_steam_web_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Firebase config stays hardcoded in `lib/firebase.js` — no `.env` entry needed.

---

# Ambiguities & Assumptions

| Item | Assumption |
|---|---|
| Steam ID source | Currently hardcoded in `steam.js` (Dylan's ID). Should come from `db.user` (Firebase UID → linked Steam ID). The `profile` page has a Steam ID input field — need to wire this into `db` and propagate to all API calls. |
| `rueter-ai` return shape | `model.prompt(str)` returns a string (the raw LLM text). Caller must parse JSON manually for structured responses like `/api/sage`. |
| Protected routes | Auth guard not yet implemented in layout. Should redirect to `/login` if `db.user` is empty/unauthenticated. |
| `suggest/` vs `dashboard/` suggestions | Both show AI recommendations but `suggest/` is the dedicated deep-dive view. Dashboard shows a preview. |
| `reviews/` route | Experimental; not a current priority. |
| `owengames.json` in lib | Test/seed data. Do not rely on it in production code. |

---

# Development Priorities & Risks

**Immediate (API system rebuild):**
1. Create structured `/api/steam/` server routes (one per Steam endpoint or grouped by interface)
2. Move Steam API key to `.env`; update `lib/steam.js` to call new routes with params — stop passing full URLs through a proxy
3. Migrate `/api/sage` from `@anthropic-ai/sdk` to `rueter-ai`
4. Wire Steam ID from `db` into all API calls (stop using the hardcoded ID in `steam.js`)

**Core features (in-progress):**
- Dashboard modules (Currently Playing, Friend Activity, Suggestions) — layout exists, components partially built
- Library browser — needs `FilterStack` + `GameGrid` connected to cache
- Suggest page — toggle "Play" / "Buy" views
- Game detail view (`/view/[appid]`)

**Risks:**
- Steam Store API (`store.steampowered.com/api/appdetails`) has aggressive rate limiting — the batch-of-4 approach is intentional; don't increase `DETAIL_BATCH_SIZE` without care
- `buildCompactProfile()` depends on game details being cached; on first visit the profile will be sparse and suggestions will be skipped (by design, via `MIN_PLAYED_GAMES` / `MIN_UNPLAYED_GAMES` guards)
- HowLongToBeat uses an unofficial third-party proxy (`hltbapi.codepotatoes.de`) — could go down; treat as non-critical
- Firebase config is public in the repo — acceptable for a class project, note it before any real launch

---

# Conventions to Follow

- **JS only** — no `.ts` files
- **No comments** unless the "why" is non-obvious
- **Svelte 5 syntax** — use `$props()`, `$state()`, `$derived()` runes; use `{@render children()}` in layouts
- **Store pattern** — all app state flows through `db` (writable store in `data.js`); pages subscribe/update `db` directly
- **API calls** — always server-side via `/api/*` routes; never call Steam or Anthropic directly from the browser
- **Caching** — use `patchCache()` helper from `cache.js` to update `db.cache`; respect TTLs
- **CSS** — scoped `<style>` blocks per component; global vars defined in `main.rue`/`main.css`; `rue-lang` optional
- **No TypeScript**, no JSDoc, no test files introduced without being asked
- **Error handling** — only at system boundaries (API responses, external services); trust internal store guarantees
