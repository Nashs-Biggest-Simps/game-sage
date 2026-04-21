# GameSage

**GameSage** is a sophisticated web application developed as a class project for **LSU CSC 4330**. It transforms the often cluttered and overwhelming Steam library experience into a clean, intelligent, and personalized gaming hub. By leveraging a user's Steam ID, the app provides an AI-driven interface that intelligently organizes games, surfaces personalized recommendations, aggregates social activity from friends, and enables seamless one-click launching of Steam titles directly from the browser.

## Group Members
(In alphabetical order)
- Aaron Meche
- David Dorleus
- Dylan Plauche
- Owen Wells
- Skylar David

## About this Project

GameSage solves the core pain points of modern Steam users: fragmented library views, difficulty discovering what to play next, and the lack of intelligent, context-aware suggestions that consider both personal play history and social context. 

The application fetches a user's complete Steam library (owned games, playtime, recent activity) via the Steam Web API and presents it through a modern, responsive SvelteKit frontend. A custom AI recommendation engine—powered by external AI API calls—analyzes:
- Games owned and their playtime metrics
- Recently played titles
- Friends' libraries and activity patterns

This generates two types of suggestions:
1. **"Play Now"** recommendations from the user's existing library (prioritizing underplayed or thematically similar titles).
2. **"Buy Next"** recommendations for titles the user does **not** own, factoring in genre affinity, friend overlap, trending popularity, and referral-linked purchase incentives.

Additional capabilities include:
- Direct Steam launch integration ("Play" / "Continue Playing" buttons that open `steam://run/<appid>` URLs).
- A passive referral revenue model: when users purchase suggested games through tracked links, the app earns affiliate revenue.
- Robust client-side caching to minimize Steam API rate limits and improve perceived performance.
- Firebase Authentication (Google OAuth only) for persistent user profiles and Steam ID storage.

The project emphasizes clean architecture, separation of concerns, and developer-friendly modularity so that future contributors (or AI agents) can easily extend the AI algorithm, add new Steam API endpoints, or integrate additional platforms (e.g., Epic Games, Xbox).

## Key Features

- **Personalized Dashboard**: At-a-glance overview of recent activity, friend updates, owned-game suggestions, and purchase recommendations.
- **Intelligent Library Browser**: Filterable, searchable, sortable grid of every owned game with rich metadata.
- **AI-Powered Suggestions Hub**: Toggle between "What to Play" and "What to Buy" with transparent reasoning displayed to the user.
- **Social Activity Feed**: Real-time (cached) view of friends' recent play sessions and library changes.
- **Unified Game Detail View**: Deep-dive page for any game (owned or suggested) with screenshots, videos, Steam reviews, store link, and launch button.
- **Profile & Steam Integration**: Simple Steam ID management with automatic profile syncing.
- **Performance-First Design**: Aggressive LocalStorage caching, server-side API proxying, and intelligent refresh logic.
- **Monetization Layer**: Referral tracking for suggested purchases (implemented via UTM parameters or Steam partner links).

## Tech Stack

- **Framework**: SvelteKit (SSR + client-side hydration)
- **Styling**: Custom `.rue` (RUE CSS preprocessor that compiles to vanilla CSS) + Tailwind-compatible utility classes via `main.css`
- **Authentication**: Firebase Auth (Google provider only)
- **Data Storage**: Browser LocalStorage (with JSON serialization via `data.js` wrapper)
- **External APIs**:
  - Steam Web API (ISteamUser, IPlayerService, ISteamApps, etc.)
  - External AI API (via `algorithm.js` – currently configured for recommendation generation)
- **Fonts**: Figtree (self-hosted in `src/lib/Figtree/`)
- **Build & Deployment**: SvelteKit adapter (Vercel/Netlify recommended for serverless API routes)

## Project Structure

The codebase follows SvelteKit conventions with a strong emphasis on modularity, reusability, and clear separation between UI, business logic, data access, and API integration layers.

src/
├── lib/
│   ├── assets/                  # Static assets (icons, logos, placeholder images, background textures)
│   │                            # All images should be optimized (WebP where possible) and imported as Svelte components or URLs.
│   ├── components/              # Reusable Svelte components used across the entire application
│   │                            # Expected components include:
│   │                            # - GameCard.svelte (compact game tile with cover, title, playtime, launch button)
│   │                            # - SuggestionCard.svelte (AI recommendation with reasoning snippet)
│   │                            # - FriendActivityItem.svelte
│   │                            # - FilterSidebar.svelte (used in library page)
│   │                            # - LoadingSpinner.svelte, ErrorState.svelte, Modal.svelte, etc.
│   │                            # All components must be fully typed (TypeScript where possible) and include responsive variants.
│   ├── Figtree/                 # Self-hosted Figtree font family (woff2 files + @font-face declarations)
│   ├── algorithm.js             # Central AI recommendation engine
│   │                            # Responsibilities:
│   │                            # - Orchestrates calls to external AI API with structured prompts based on user library, playtime, and friend data
│   │                            # - Implements refresh timers (e.g., 24-hour cooldown for full recomputation)
│   │                            # - Caches recommendations in LocalStorage with expiration metadata
│   │                            # - Exports functions like getPlaySuggestions(userData) and getBuySuggestions(userData)
│   │                            # - Includes fallback logic when AI API is unavailable
│   ├── auth.js                  # Firebase Authentication wrapper
│   │                            # - Google sign-in/out flows
│   │                            # - Current user state management (Svelte stores)
│   │                            # - Steam ID persistence linked to Firebase user UID
│   ├── cache.js                 # Intelligent caching layer for Steam API responses
│   │                            # - Abstracts LocalStorage with TTL, versioning, and invalidation hooks
│   │                            # - Reduces Steam API calls by >90% on subsequent visits
│   │                            # - Exports cache.get(key) / cache.set(key, data, ttl) helpers
│   ├── data.js                  # LocalStorage database abstraction
│   │                            # - Exports a reactive db Svelte store
│   │                            # - Provides typed getters/setters for user profile, Steam ID, cached library, etc.
│   │                            # - All pages import and subscribe to this store for reactive updates
│   ├── firebase.js              # Firebase SDK initialization and config
│   │                            # - Contains initializeApp, auth instance, and environment-variable-safe config
│   ├── main.css                 # Global styles and Tailwind base (if used)
│   ├── main.rue                 # Primary stylesheet written in RUE (nested CSS preprocessor)
│   │                            # - All component-specific styles should be scoped here or in component <style> blocks
│   └── steam.js                 # Unified Steam API client (server-side safe)
│                                # - Exports steamAPI object containing all endpoints:
│                                #   - getOwnedGames(steamID)
│                                #   - getPlayerSummaries(steamIDs)
│                                #   - getFriendList(steamID)
│                                #   - getRecentlyPlayedGames(steamID)
│                                #   - getGameDetails(appID) – aggregates store data + reviews
│                                # - All calls are routed through /api/steam/... server endpoints to bypass CORS and API key exposure
│
└── routes/
├── activity/                    # /activity – Social & recent activity hub
│                                # Purpose: Show user's own recent play sessions + aggregated friend activity feed.
│                                # Content: Timeline-style feed, "Friends Playing Now" carousel, playtime comparison charts.
│                                # Interactions: Clickable game cards that navigate to /view/[appid].
│                                # Data sources: steamAPI.getRecentlyPlayedGames + cached friend data.
│
├── algorithm/                   # /algorithm – Development & debugging page (hidden in production)
│                                # Purpose: Internal tool for testing and iterating on the AI recommendation engine.
│                                # Content: Raw JSON output of AI prompts/responses, manual refresh buttons, performance metrics.
│                                # Should be removed or protected by admin flag before production.
│
├── api/                         # Server-side API routes (SvelteKit +server.ts files)
│                                # Purpose: Proxy all Steam Web API calls to keep API keys secret and avoid CORS issues.
│                                # Expected endpoints:
│                                # - +server.ts files under steam/[endpoint]/ for each major Steam function
│                                # - Rate limiting and caching headers should be implemented here
│
├── dashboard/                   # /dashboard – Primary landing page after login (most important user-facing page)
│                                # Purpose: Personalized home screen that gives users immediate value.
│                                # Layout (grid-based, responsive):
│                                # - Hero section with "Continue Playing" for most recent game
│                                # - "Suggested to Play" horizontal scroll (owned games)
│                                # - "Suggested to Buy" horizontal scroll (AI recommendations with referral links)
│                                # - Recent Activity (user + friends) feed
│                                # - Quick stats (total games, hours played this week, friend overlap)
│                                # Must handle empty states gracefully (new users, no friends, etc.).
│
├── library/                     # /library – Full Steam library browser
│                                # Purpose: Power-user view of entire owned game collection.
│                                # Layout: Two-column – left sidebar with advanced filters (genre, playtime, tags, alphabetical, sort by hours, last played, etc.), right side infinite-scroll or virtualized grid of GameCard components.
│                                # Features: Search bar (client-side + Steam name filtering), bulk actions, export library option.
│                                # Heavily relies on cache.js and data.js.
│
├── login/                       # /login – Authentication entry point
│                                # Purpose: Simple, branded login screen using Firebase Google OAuth.
│                                # After successful login, automatically redirects to /dashboard.
│                                # Includes graceful handling for existing users with missing Steam ID (prompts them to set it).
│
├── profile/                     # /profile – User settings and Steam profile sync
│                                # Purpose: Minimalist profile management page.
│                                # Content:
│                                # - Display Steam profile avatar, persona name, level (fetched via steamAPI)
│                                # - Editable Steam ID field with validation (must be 17-digit numeric)
│                                # - "Refresh Library" button that triggers full cache invalidation + re-fetch
│                                # - Account settings (logout, delete data)
│
├── reviews/                     # /reviews – Experimental Steam review aggregator
│                                # Purpose: Display aggregated user reviews for games in the user's library or suggestions.
│                                # Content: Review cards with sentiment analysis preview (future AI enhancement possible).
│                                # Currently pulls raw Steam review data; may be expanded with AI summarization.
│
├── suggest/                     # /suggest – Dedicated AI recommendation center
│                                # Purpose: Deep-dive into algorithmic suggestions with user control.
│                                # UI: Top toggle switch ("What to Play" ↔ "What to Buy")
│                                # - "What to Play": Ranked list of owned games with AI reasoning ("You loved similar titles...", "You've only played 12 hours...")
│                                # - "What to Buy": Curated external titles with price estimates, Steam store links, and referral tracking.
│                                # Includes "Why this game?" expandable explanations and "Refresh Suggestions" button.
│
├── view/                        # /view/[appid] – Dynamic game detail page (catch-all route)
│                                # Purpose: Single source of truth for any game display (owned or suggested).
│                                # Content (tabbed or sectioned layout):
│                                # - Hero banner + screenshots carousel
│                                # - Embedded Steam store trailer/video
│                                # - Detailed description, genres, tags, release date, developers/publishers
│                                # - Playtime statistics (if owned)
│                                # - Full Steam review summary + recent reviews
│                                # - "Play on Steam" or "View on Steam Store" buttons
│                                # - AI insight box (e.g., "Your friends own this too" or "Matches 87% of your playstyle")
│                                # Must work for both owned games and non-owned suggestions.
│
├── +error.svelte                # Global SvelteKit error boundary
│                                # Should display friendly error messages, retry buttons, and log errors appropriately.
│
├── +layout.svelte               # Root layout wrapper
│                                # Defines global navigation (sidebar or top nav), footer, toast system, and theme provider.
│                                # Includes protected-route logic (redirect unauthenticated users to /login).
│
└── +page.svelte                 # Landing page (/)

Purpose: Marketing-style homepage for unauthenticated visitors.
Content: Hero section explaining GameSage, feature highlights, demo screenshots, "Sign in with Google" CTA.
If user is already authenticated, auto-redirect to /dashboard.

## Data Flow & Architecture Highlights

1. User logs in → Firebase Auth → Steam ID retrieved from `data.js`
2. All Steam data is fetched **server-side** via `/api/steam/*` → cached in browser LocalStorage
3. `algorithm.js` consumes cached library data → sends structured prompt to AI API → stores recommendations
4. Every page subscribes to the central `db` store for reactive updates
5. Navigation between pages uses SvelteKit file-based routing and `goto()` for SPA feel