<script>
    import { onMount }  from 'svelte'
    import { db }       from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { Algorithm } from '$lib/algorithm'
    import SuggestRow   from '$lib/components/Dashboard/SuggestRow.svelte'

    const algo = new Algorithm()
    const LOCAL_ROW_LIMIT = 12

    // ── Row state ────────────────────────────────────────────────────────────────
    let hotItems      = $state([])
    let hotLoading    = $state(true)
    let playItems     = $state([])
    let playLoading   = $state(true)
    let buyItems      = $state([])
    let buyLoading    = $state(true)
    let friendItems   = $state([])
    let friendLoading = $state(true)

    let hasSteamID      = $derived(!!$db?.steamID)
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded  ?? [])
    let libraryDetails  = $derived($db?.cache?.library?.details ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let libraryGames    = $derived(buildLibraryGames(libraryDetails, libraryPlaytime))
    let localLibraryItems = $derived(buildLocalLibrarySuggestions(libraryGames, preferredGenres, excludedGenres))
    let fallbackItems      = $derived(buildNoAiSuggestions(libraryGames, localLibraryItems, preferredGenres, excludedGenres))

    let mounted = $state(false)
    let prefDebounce = null

    // Re-fetch play & buy suggestions whenever genre prefs change after mount
    $effect(() => {
        const _p = preferredGenres.length
        const _e = excludedGenres.length
        if (!mounted || !hasSteamID) return
        clearTimeout(prefDebounce)
        prefDebounce = setTimeout(() => {
            algo.invalidate('all')
            playLoading = true
            buyLoading  = true
            algo.getPlaySuggestions().then(s => { playItems = s; playLoading = false })
            algo.getBuySuggestions().then(s  => { buyItems  = s; buyLoading  = false })
        }, 600)
    })

    // ── Active section jump ───────────────────────────────────────────────────────
    const SECTIONS = [
        { id: 'hot',     label: 'Hot Right Now',    icon: 'fire'               },
        { id: 'play',    label: 'For You',           icon: 'gamepad'            },
        { id: 'library', label: 'From Library',      icon: 'grip'               },
        { id: 'fallback', label: 'No-AI Picks',      icon: 'shield-halved'      },
        { id: 'buy',     label: 'Consider Buying',   icon: 'cart-shopping'      },
        { id: 'friends', label: 'Friends Playing',   icon: 'user-group'         },
    ]

    function scrollTo(id) {
        document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    function genreNames(game) {
        return (game?.genres ?? []).map(g => g.description).filter(Boolean)
    }

    function hasExcludedGenre(game, excluded) {
        if (!excluded.length) return false
        const genres = genreNames(game).map(g => g.toLowerCase())
        return excluded.some(g => genres.includes(g.toLowerCase()))
    }

    function buildLibraryGames(details, playtime) {
        return Object.entries(details)
            .map(([id, entry]) => {
                const game = entry?.data
                if (!game?.steam_appid) return null
                return {
                    game,
                    playtime: playtime[id] ?? playtime[game.steam_appid] ?? 0,
                }
            })
            .filter(Boolean)
    }

    function buildGenreWeights(games) {
        const weights = new Map()
        for (const { game, playtime } of games) {
            if (playtime <= 0) continue
            const hours = Math.max(1, Math.round(playtime / 60))
            for (const genre of genreNames(game)) {
                weights.set(genre, (weights.get(genre) ?? 0) + hours)
            }
        }
        return weights
    }

    function topGenreMatch(game, weights, preferred = []) {
        const genres = genreNames(game)
        const preferredLower = preferred.map(g => g.toLowerCase())
        const preferredMatch = genres.find(g => preferredLower.includes(g.toLowerCase()))
        if (preferredMatch) return preferredMatch

        return genres
            .map(g => ({ genre: g, weight: weights.get(g) ?? 0 }))
            .sort((a, b) => b.weight - a.weight)[0]?.genre ?? null
    }

    function buildLocalLibrarySuggestions(games, preferred, excluded) {
        const weights = buildGenreWeights(games)
        const preferredLower = preferred.map(g => g.toLowerCase())

        return games
            .filter(({ game, playtime }) => playtime === 0 && !hasExcludedGenre(game, excluded))
            .map(({ game }) => {
                const match = topGenreMatch(game, weights, preferred)
                const genres = genreNames(game)
                const score = genres.reduce((sum, genre) => {
                    const preferenceBoost = preferredLower.includes(genre.toLowerCase()) ? 500 : 0
                    return sum + (weights.get(genre) ?? 0) + preferenceBoost
                }, 0)

                return {
                    game,
                    score,
                    reason: match
                        ? `Recommended from your library because it matches ${match}.`
                        : 'Recommended from your unplayed library.',
                }
            })
            .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
            .slice(0, LOCAL_ROW_LIMIT)
    }

    function buildNoAiSuggestions(games, librarySuggestions, preferred, excluded) {
        const used = new Set(librarySuggestions.map(item => item.game?.steam_appid))
        const weights = buildGenreWeights(games)

        return games
            .filter(({ game }) => !used.has(game.steam_appid) && !hasExcludedGenre(game, excluded))
            .map(({ game, playtime }) => {
                const match = topGenreMatch(game, weights, preferred)
                const score = (playtime > 0 ? Math.log(playtime + 1) * 100 : 0)
                    + genreNames(game).reduce((sum, genre) => sum + (weights.get(genre) ?? 0), 0)

                return {
                    game,
                    score,
                    reason: playtime > 0
                        ? 'No-AI pick based on your existing playtime.'
                        : match
                            ? `No-AI pick from your library with ${match} tags.`
                            : 'No-AI pick from your cached library.',
                }
            })
            .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
            .slice(0, LOCAL_ROW_LIMIT)
    }

    // ── Data fetching ────────────────────────────────────────────────────────────
    async function loadHot() {
        hotLoading = true
        try {
            const data = await new Promise(res => steamAPI.getFeaturedGames(res))
            const raw  = data?.top_sellers?.items ?? data?.specials?.items ?? []
            hotItems   = raw.slice(0, 12).map(g => ({
                game:   { steam_appid: g.id, name: g.name },
                reason: g.discount_percent > 0 ? `${g.discount_percent}% off right now` : 'Top seller on Steam',
            }))
        } catch { hotItems = [] }
        hotLoading = false
    }

    async function loadFriends() {
        if (!$db?.steamID) { friendLoading = false; return }
        friendLoading = true
        try {
            steamAPI.getFriendList(res => {
                const friends = res?.friendslist?.friends?.slice(0, 50) ?? []
                if (!friends.length) { friendLoading = false; return }
                const ids = friends.map(f => f.steamid)
                steamAPI.getPlayerSummaries(ids, res2 => {
                    const players = res2?.response?.players ?? []
                    const inGame  = players
                        .filter(p => p.gameid && p.gameextrainfo)
                        .map(p => ({
                            game:   { steam_appid: parseInt(p.gameid), name: p.gameextrainfo },
                            reason: `${p.personaname} is playing this right now`,
                            _avatar: p.avatarmedium,
                            _friend: p.personaname,
                        }))
                    friendItems   = inGame
                    friendLoading = false
                })
            })
        } catch { friendLoading = false }
    }

    onMount(() => {
        loadHot()
        if (hasSteamID) {
            algo.getPlaySuggestions().then(s => { playItems  = s;  playLoading  = false })
            algo.getBuySuggestions().then(s  => { buyItems   = s;  buyLoading   = false })
            loadFriends()
        } else {
            playLoading  = false
            buyLoading   = false
            friendLoading = false
        }
        mounted = true
    })
</script>

<div class="page">

    <!-- ── Sidebar ──────────────────────────────────────────────── -->
    <aside class="sidebar">
        <div class="sidebar-heading">Sections</div>
        <nav class="sidebar-nav">
            {#each SECTIONS as s}
                <button class="sidebar-item" onclick={() => scrollTo(s.id)}>
                    <i class="fa-solid fa-{s.icon}"></i>
                    {s.label}
                </button>
            {/each}
        </nav>

        {#if preferredGenres.length > 0 || excludedGenres.length > 0}
        <div class="prefs-indicator">
            <div class="prefs-heading">
                <i class="fa-solid fa-sliders"></i>
                Active Filters
            </div>
            {#if preferredGenres.length > 0}
                <div class="prefs-row prefer">
                    <i class="fa-solid fa-heart"></i>
                    {preferredGenres.slice(0, 3).join(', ')}{preferredGenres.length > 3 ? ` +${preferredGenres.length - 3}` : ''}
                </div>
            {/if}
            {#if excludedGenres.length > 0}
                <div class="prefs-row exclude">
                    <i class="fa-solid fa-ban"></i>
                    {excludedGenres.slice(0, 3).join(', ')}{excludedGenres.length > 3 ? ` +${excludedGenres.length - 3}` : ''}
                </div>
            {/if}
            <a href="/profile" class="prefs-edit-link">
                Edit in Preferences →
            </a>
        </div>
        {/if}
    </aside>

    <!-- ── Main content ─────────────────────────────────────────── -->
    <main class="main">

        <!-- Hot Right Now -->
        <section id="section-hot">
            <SuggestRow
                title="Hot Right Now"
                type="play"
                items={hotItems}
                loading={hotLoading}
                emptyIcon="fire"
                emptyText="Could not load trending games."
            />
        </section>

        <!-- For You: AI play suggestions -->
        <section id="section-play">
            {#if hasSteamID}
                <SuggestRow
                    title="Suggested for You"
                    type="play"
                    items={playItems}
                    loading={playLoading}
                    emptyIcon="gamepad"
                    emptyText="Play suggestions appear once your library finishes loading."
                />
            {:else}
                <div class="no-steam-row">
                    <div class="no-steam-icon"><i class="fa-solid fa-gamepad"></i></div>
                    <div>
                        <div class="no-steam-title">Suggested for You</div>
                        <div class="no-steam-desc">Add your Steam ID in your profile to get personalized play recommendations.</div>
                    </div>
                </div>
            {/if}
        </section>

        <!-- Recommended From Library: local library suggestions -->
        <section id="section-library">
            {#if hasSteamID}
                <SuggestRow
                    title="Recommended From Your Library"
                    type="play"
                    items={localLibraryItems}
                    loading={false}
                    emptyIcon="grip"
                    emptyText="Library recommendations appear once your cached library details load."
                />
            {:else}
                <div class="no-steam-row">
                    <div class="no-steam-icon"><i class="fa-solid fa-grip"></i></div>
                    <div>
                        <div class="no-steam-title">Recommended From Your Library</div>
                        <div class="no-steam-desc">Add your Steam ID to get recommendations from your owned games.</div>
                    </div>
                </div>
            {/if}
        </section>

        <!-- No-AI Suggestions: deterministic fallback picks -->
        <section id="section-fallback">
            {#if hasSteamID}
                <SuggestRow
                    title="No-AI Suggestions"
                    type="play"
                    items={fallbackItems}
                    loading={false}
                    emptyIcon="shield-halved"
                    emptyText="No-AI suggestions appear once your cached library details load."
                />
            {:else}
                <div class="no-steam-row">
                    <div class="no-steam-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    <div>
                        <div class="no-steam-title">No-AI Suggestions</div>
                        <div class="no-steam-desc">Add your Steam ID to unlock suggestions that work without the AI system.</div>
                    </div>
                </div>
            {/if}
        </section>

        <!-- Consider Buying: AI buy suggestions -->
        <section id="section-buy">
            {#if hasSteamID}
                <SuggestRow
                    title="Consider Buying"
                    type="buy"
                    items={buyItems}
                    loading={buyLoading}
                    emptyIcon="cart-shopping"
                    emptyText="Buy suggestions appear once your library finishes loading."
                />
            {:else}
                <div class="no-steam-row">
                    <div class="no-steam-icon"><i class="fa-solid fa-cart-shopping"></i></div>
                    <div>
                        <div class="no-steam-title">Consider Buying</div>
                        <div class="no-steam-desc">Add your Steam ID to get personalized game purchase recommendations.</div>
                    </div>
                </div>
            {/if}
        </section>

        <!-- Friends Playing -->
        <section id="section-friends">
            {#if hasSteamID}
                <SuggestRow
                    title="Friends Playing Right Now"
                    type="play"
                    items={friendItems}
                    loading={friendLoading}
                    emptyIcon="user-group"
                    emptyText="None of your friends are in a game right now."
                />
            {:else}
                <div class="no-steam-row">
                    <div class="no-steam-icon"><i class="fa-solid fa-user-group"></i></div>
                    <div>
                        <div class="no-steam-title">Friends Playing Right Now</div>
                        <div class="no-steam-desc">Add your Steam ID to see what your friends are playing.</div>
                    </div>
                </div>
            {/if}
        </section>

    </main>
</div>

<style>
    .page {
        display: grid;
        grid-template-columns: 13rem minmax(0, 1fr);
        gap: 2.4rem;
        align-items: start;
    }

    /* ── Sidebar ──────────────────────── */

    .sidebar {
        position: sticky;
        top: 2.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .sidebar-heading {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.4;
    }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .sidebar-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0.65rem;
        border-radius: 0.55rem;
        font-size: 0.84rem;
        font-weight: 500;
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
        transition: background 120ms, opacity 120ms;
    }

    .sidebar-item:hover { background: var(--l1); opacity: 1; }
    .sidebar-item i { width: 0.9rem; text-align: center; font-size: 0.75rem; flex-shrink: 0; }

    /* ── Prefs indicator ─────────── */

    .prefs-indicator {
        margin-top: 0.8rem;
        padding: 0.85rem;
        background: var(--la1);
        border-radius: 0.75rem;
        outline: solid 1pt var(--la3);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .prefs-heading {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--bright-accent);
        opacity: 0.85;
    }

    .prefs-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.72rem;
        font-weight: 500;
        line-height: 1.4;
    }

    .prefs-row.prefer { color: var(--bright-accent); }
    .prefs-row.exclude { color: hsl(0, 70%, 65%); }
    .prefs-row i { font-size: 0.6rem; flex-shrink: 0; }

    .prefs-edit-link {
        font-size: 0.68rem;
        color: var(--bright-accent);
        opacity: 0.6;
        margin-top: 0.1rem;
        text-decoration: none;
        transition: opacity 120ms;
    }

    .prefs-edit-link:hover { opacity: 1; }

    /* ── Main ─────────────────────────── */

    .main {
        display: flex;
        flex-direction: column;
        gap: 2.8rem;
    }

    section { scroll-margin-top: 2.4rem; }

    /* ── No Steam ID placeholder rows ─── */

    .no-steam-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 1.4rem 1.6rem;
        background: var(--l1);
        border-radius: 1rem;
        outline: solid 1pt var(--l2);
        opacity: 0.55;
    }

    .no-steam-icon {
        width: 2.8rem;
        height: 2.8rem;
        border-radius: 0.7rem;
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
    }

    .no-steam-title { font-size: 0.92rem; font-weight: 700; margin-bottom: 0.25rem; }
    .no-steam-desc  { font-size: 0.78rem; opacity: 0.7; line-height: 1.5; }
</style>
