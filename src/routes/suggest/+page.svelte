<script>
    import { onMount } from 'svelte'
    import { db } from '$lib/data'
    import { Algorithm } from '$lib/algorithm'
    import { refreshFriends } from '$lib/cache'
    import { steamAPI } from '$lib/steam'
    import { makeStoreThumbnail } from '$lib/steam-media'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import RecommendationRail from '$lib/components/Dashboard/RecommendationRail.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'

    const algorithm = new Algorithm()

    let playItems = $state([])
    let buyItems = $state([])
    let hotItems = $state([])
    let playLoading = $state(true)
    let buyLoading = $state(true)
    let hotLoading = $state(true)

    let hasSteamID = $derived(!!$db?.steamID)
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres = $derived($db?.prefs?.genres?.excluded ?? [])
    let refreshHours = $derived($db?.prefs?.suggestions?.refreshHours ?? 24)

    let worthBuying = $derived(buyItems.filter((item) => item.sourceType !== 'friend'))
    let friendDriven = $derived(buyItems.filter((item) => item.sourceType === 'friend'))

    async function loadHotItems() {
        hotLoading = true

        try {
            const payload = await steamAPI.getFeaturedGames()
            const trending = payload?.top_sellers?.items ?? payload?.specials?.items ?? []
            hotItems = trending.slice(0, 8).map((item) => ({
                appid: Number(item.id),
                name: item.name,
                reason: item.discount_percent > 0 ? `${item.discount_percent}% off and climbing on Steam.` : 'Trending across Steam right now.',
                price: null,
                thumbnail: makeStoreThumbnail(item.id),
                sourceLabel: 'Hot right now',
                storeData: null,
            }))
        } catch (error) {
            console.warn('[suggest] Could not load featured Steam games:', error)
            hotItems = []
        } finally {
            hotLoading = false
        }
    }

    async function loadSuggestions() {
        playLoading = true
        buyLoading = true

        playItems = await algorithm.getPlaySuggestions()
        buyItems = await algorithm.getBuySuggestions()

        playLoading = false
        buyLoading = false
    }

    async function refreshPlay() {
        playLoading = true
        algorithm.invalidate('play')
        playItems = await algorithm.getPlaySuggestions()
        playLoading = false
    }

    async function refreshBuy() {
        buyLoading = true
        algorithm.invalidate('buy')
        buyItems = await algorithm.getBuySuggestions()
        buyLoading = false
    }

    function feedback(item, liked) {
        algorithm.recordInteraction({ name: item.name }, liked)
    }

    onMount(() => {
        refreshFriends()
        loadHotItems()
        if (hasSteamID) loadSuggestions()
        else {
            playLoading = false
            buyLoading = false
        }
    })
</script>

<div class="suggest-page">
    <div class="main-column">
        <PageHeader
            eyebrow="Reliable recommendations"
            title="A suggestion center that still works when the AI layer is quiet."
            description="GameSage now ranks owned backlog picks and store candidates heuristically first, then uses AI only to sharpen the copy. That means the page keeps loading useful cards instead of collapsing into empty states every refresh."
        />

        {#if hasSteamID}
            <SurfacePanel>
                <RecommendationRail
                    title="Play next"
                    subtitle="Owned backlog picks ranked from your real library signals."
                    badge="Library"
                    items={playItems}
                    loading={playLoading}
                    onRefresh={refreshPlay}
                    emptyTitle="Owned recommendations need more synced library detail."
                    emptyDescription="Once your detail cache finishes hydrating, GameSage can rank underplayed games against your top genres and recent habits."
                />
            </SurfacePanel>

            <SurfacePanel>
                <RecommendationRail
                    title="Worth buying"
                    subtitle="Store candidates that match your current taste profile."
                    badge="Store"
                    kind="buy"
                    items={worthBuying}
                    loading={buyLoading}
                    onRefresh={refreshBuy}
                    onFeedback={feedback}
                    emptyTitle="No store-side matches are ready yet."
                    emptyDescription="The deterministic buy pass combines Steam featured items with your own genre profile before AI writes the one-line reason."
                />
            </SurfacePanel>

            <SurfacePanel>
                <RecommendationRail
                    title="Because your friends are playing"
                    subtitle="Friend-driven store picks stay visible as their own section instead of being buried in a generic feed."
                    badge="Social"
                    kind="buy"
                    items={friendDriven}
                    loading={buyLoading}
                    onRefresh={refreshBuy}
                    onFeedback={feedback}
                    emptyTitle="None of your active friend signals are strong enough yet."
                    emptyDescription="When friends are in games you do not own, they show up here as separate buy candidates."
                />
            </SurfacePanel>
        {:else}
            <EmptyState icon="link" title="Suggestions unlock once you add a Steam ID." description="Guest mode still works across the app, but the recommendation engine needs a synced Steam library before it can rank backlog or store candidates." />
        {/if}

        <SurfacePanel>
            <RecommendationRail
                title="Hot right now"
                subtitle="Steam-wide heat that stays visible even if your personal recommendation cache is cold."
                badge="Trending"
                kind="buy"
                items={hotItems}
                loading={hotLoading}
                onRefresh={loadHotItems}
                emptyTitle="Steam featured data is temporarily unavailable."
                emptyDescription="This row comes directly from Steam’s featured categories and acts as a stable fallback surface."
            />
        </SurfacePanel>
    </div>

    <aside class="side-column">
        <SurfacePanel>
            <div class="prefs-card">
                <div class="card-title">Active tuning</div>
                <div class="tuning-row">
                    <span>Cache cadence</span>
                    <strong>{refreshHours}h</strong>
                </div>
                <div class="tag-block">
                    <small>Preferred genres</small>
                    <div class="chips">
                        {#if preferredGenres.length > 0}
                            {#each preferredGenres as genre}
                                <span class="chip">{genre}</span>
                            {/each}
                        {:else}
                            <span class="chip">No preferred genres</span>
                        {/if}
                    </div>
                </div>
                <div class="tag-block">
                    <small>Excluded genres</small>
                    <div class="chips">
                        {#if excludedGenres.length > 0}
                            {#each excludedGenres as genre}
                                <span class="chip">{genre}</span>
                            {/each}
                        {:else}
                            <span class="chip">No excluded genres</span>
                        {/if}
                    </div>
                </div>
            </div>
        </SurfacePanel>

        <SurfacePanel>
            <div class="prefs-card">
                <div class="card-title">Why this page is different now</div>
                <ul class="note-list">
                    <li>Owned and store candidates are ranked before AI is asked to explain them.</li>
                    <li>Each section has a scoped refresh action instead of a single fragile page-wide reload.</li>
                    <li>Trending and friend-driven surfaces stay visible even if one recommendation stream is empty.</li>
                </ul>
            </div>
        </SurfacePanel>
    </aside>
</div>

<style>
    .suggest-page {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.9fr);
        gap: 1.2rem;
        align-items: start;
    }

    .main-column,
    .side-column,
    .prefs-card,
    .tag-block {
        display: grid;
    }

    .main-column,
    .side-column {
        gap: 1.2rem;
    }

    .side-column {
        position: sticky;
        top: 5.8rem;
    }

    .prefs-card {
        gap: 1rem;
    }

    .card-title {
        font-size: 0.96rem;
        font-weight: 700;
    }

    .tuning-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.9rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
        color: var(--text-muted);
    }

    .tag-block {
        gap: 0.55rem;
    }

    .tag-block small {
        color: var(--text-dim);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
    }

    .chips {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
    }

    .note-list {
        margin: 0;
        padding-left: 1rem;
        color: var(--text-muted);
        line-height: 1.7;
        display: grid;
        gap: 0.55rem;
    }

    @media (max-width: 1080px) {
        .suggest-page {
            grid-template-columns: 1fr;
        }

        .side-column {
            position: static;
        }
    }
</style>
