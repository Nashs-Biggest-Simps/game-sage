# GameSage

**GameSage** is a sleek, full-stack SvelteKit web application that turns your Steam library into an intelligent, personalized gaming command center. Enter your Steam ID once, and GameSage instantly fetches your games, playtime data, and friends list—then delivers clean, intuitive dashboards, AI-powered suggestions for what to play next, and smart recommendations for new titles to buy.

Built as a capstone project for **LSU CSC 4330 — Software Development** (Spring 2026) by Aaron Meche, David Dorleus, Dylan Plauche, Owen Wells, and Skylar David.

---

## Why GameSage?

Steam’s default interface is powerful but overwhelming—especially for players with hundreds or thousands of titles. GameSage solves the “what do I even play?” problem by combining:

- **AI-driven intelligence** that understands your taste from actual playtime patterns and genre affinity
- **Real-time social context** showing what your friends are playing right now
- **Modern, responsive design** that makes massive libraries feel manageable and fun again

Whether you’re a casual gamer or a dedicated collector, GameSage replaces tab-switching fatigue with one beautiful, proactive hub.

---

## Key Features

| Feature                     | Description |
|-----------------------------|-------------|
| **Continue Playing**        | Hero banner with your most recent game and one-click Steam launch |
| **AI Play Suggestions**     | Smart recommendations for unplayed games you already own |
| **AI Buy Suggestions**      | Tailored new-game ideas based on your profile and friends’ activity |
| **Thumbs Feedback Loop**    | Like or dislike suggestions to instantly refine future AI results |
| **Live Friend Activity**    | Real-time feed of who’s online and in-game (refreshes every 60 seconds) |
| **Library Browser**         | Beautiful, filterable grid with incremental loading and cover art |
| **Playtime Analytics**      | At-a-glance stats: total hours, completion percentage, weekly trends |
| **Game Detail Pages**       | Rich per-game views with descriptions, genres, pricing, and HowLongToBeat data |
| **Search & Discovery**      | Instant search across your library or the full Steam Store |
| **Customizable Dashboard**  | Toggle sections, adjust AI tone, and set genre preferences |

---

## Tech Stack

| Technology                      | Role |
|---------------------------------|------|
| **SvelteKit (Svelte 5)**        | Full-stack framework with SSR, file-based routing, and runes |
| **rueter-ai**                   | Lightweight LLM wrapper (Aaron’s package) powering all Grok calls |
| **Firebase Auth**               | Google OAuth + session management |
| **Steam Web & Store APIs**      | Official sources for library, friends, playtime, and metadata |
| **Grok (xAI)**                  | Core LLM for intelligent recommendations |
| **HowLongToBeat API**           | Accurate playtime estimates |
| **LocalStorage + custom store** | Zero-server persistence with smart quota handling |
| **Firebase Hosting**            | Production deployment target |

---

## Architecture Highlights

GameSage is deliberately simple yet highly performant:

- **Single source of truth**: One central Svelte writable store (`db`) that auto-persists to LocalStorage on every change.
- **Smart caching**: TTL-based system prevents unnecessary API calls while keeping data fresh.
- **Incremental loading**: Game details are fetched in small batches (10 at a time) to respect Steam rate limits and browser storage constraints.
- **Server-side AI**: All Grok calls happen through a secure `/api/sage` endpoint—API keys never touch the browser.
- **Unified game data**: Every title (owned or suggested) lives in a single `game_details` map for maximum reuse and minimal duplication.

Full architecture diagrams and data-flow explanations are available in the [`ARCHITECTURE.md`](ARCHITECTURE.md) file (or scroll down for the detailed sections in this README).

---

## Vision & Future Monetization

While built as an academic project, GameSage is designed with real-world scalability in mind. Potential revenue streams include:

- Targeted, non-intrusive advertisements
- Premium tier unlocking advanced analytics, priority AI features, and custom themes
- Affiliate referral links to the Steam Store for AI-recommended purchases

These ideas remain flexible and will be refined based on user feedback.