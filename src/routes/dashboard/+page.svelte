<script>
    import { onMount } from 'svelte'
    import { db }      from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'
    import { Algorithm }    from '$lib/algorithm'
    import ContinuePlaying  from '$lib/components/Dashboard/ContinuePlaying.svelte'
    import SuggestRow       from '$lib/components/Dashboard/SuggestRow.svelte'
    import NewsDisplay      from '$lib/components/games/NewsDisplay.svelte';
    import QuickStats       from '$lib/components/mod/QuickStats.svelte'
    import ActivityFeed     from '$lib/components/mod/ActivityFeed.svelte'
    import RecentlyPlayed from '$lib/components/mod/RecentlyPlayed.svelte';

    const algo = new Algorithm()

    let playSuggestions = $state([])
    let buySuggestions  = $state([])
    let playLoading     = $state(true)
    let buyLoading      = $state(true)

    let mostRecentGame = $derived($db?.cache?.recentlyPlayed?.data[0] ?? null)
    let libraryCount = $derived(($db?.cache?.library?.appIdList ?? []).length)

    async function refreshPlay() {
        playLoading = true
        algo.invalidate('play')
        playSuggestions = await algo.getPlaySuggestions()
        playLoading = false
    }

    async function refreshBuy() {
        buyLoading = true
        algo.invalidate('buy')
        buySuggestions = await algo.getBuySuggestions()
        buyLoading = false
    }

    // Returns the confirmed thumbnail URL for a recently-played game.
    // Reads from the library detail cache (populated by cache.js) which stores
    // the pre-resolved thumbnail so no runtime fallback logic is needed.
    function getRecentThumbnail(appid) {
        return $db?.cache?.library?.details?.[appid]?.data?.thumbnail ?? null
    }

    onMount(() => {
        algo.getPlaySuggestions().then(s => { playSuggestions = s; playLoading = false })
        algo.getBuySuggestions().then(s => { buySuggestions  = s; buyLoading  = false })
    })
</script>

<div class="dashboard">
    <section class="hero-section">
        <ContinuePlaying />
    </section>

    <div class="main-grid">
        <div class="left-col">
            <!-- Recently Played Scroll -->
            <section class="row-section">
                <div class="row-header">
                    <div class="row-title">Recently Played</div>
                </div>
                <RecentlyPlayed />
            </section>
            <!-- News for Recently Played Game -->
            {#if mostRecentGame}
            <section class="row-section">
                <div class="row-header">
                    <span class="row-title">What's New</span>
                    <span class="news-game-label">for {mostRecentGame.name}</span>
                </div>
                <NewsDisplay game={mostRecentGame} />
            </section>
            {/if}
        </div>

        <aside class="right-col">
            <QuickStats />
            <ActivityFeed />
        </aside>
    </div>

</div>

<style>
    .dashboard {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .main-grid {
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 3fr);
        gap: 2.4rem;
        align-items: start;
    }

    .left-col {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .right-col {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        position: sticky;
        top: 2.4rem;
    }

    .news-game-label {
        font-size: 0.72rem;
        font-weight: 500;
        opacity: 0.4;
    }
</style>
