<script>
    import { onMount } from 'svelte'
    import { db } from '$lib/data'
    import { Algorithm } from '$lib/algorithm'
    import { refreshFriends } from '$lib/cache'
    import { steamAPI } from '$lib/steam'
    import {
        getPlayedCount,
        getRecentSummaries,
        getTopGenres,
        getTopPlayedGames,
        getTotalMinutes,
        getUnplayedCount,
    } from '$lib/insights'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import SectionHeader from '$lib/components/layout/SectionHeader.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import ContinuePlayingHero from '$lib/components/Dashboard/ContinuePlayingHero.svelte'
    import FriendSnapshot from '$lib/components/Dashboard/FriendSnapshot.svelte'
    import RecommendationRail from '$lib/components/Dashboard/RecommendationRail.svelte'
    import StatsGrid from '$lib/components/Dashboard/StatsGrid.svelte'
    import CompactActivityCard from '$lib/components/cards/CompactActivityCard.svelte'

    const algorithm = new Algorithm()

    let playSuggestions = $state([])
    let buySuggestions = $state([])
    let playLoading = $state(true)
    let buyLoading = $state(true)
    let news = $state([])
    let loadedNewsAppid = $state(null)

    let dashboardPrefs = $derived($db?.prefs?.dashboard ?? {})
    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let libraryDetails = $derived($db?.cache?.library?.details ?? {})
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let friends = $derived($db?.cache?.friends?.data ?? [])

    let heroGame = $derived(recentGames[0] ?? null)
    let heroDetail = $derived(heroGame ? libraryDetails[heroGame.appid]?.data ?? null : null)
    let recentCards = $derived(getRecentSummaries(recentGames, libraryDetails))
    let totalHours = $derived(Math.round(getTotalMinutes(playtime) / 60))
    let playedCount = $derived(getPlayedCount(playtime))
    let unplayedCount = $derived(getUnplayedCount(playtime))
    let libraryCount = $derived(Object.keys(playtime).length)
    let exploredPercent = $derived(libraryCount > 0 ? Math.round((playedCount / libraryCount) * 100) : 0)
    let weekHours = $derived(Math.round(recentGames.reduce((total, game) => total + (game.playtime_2weeks ?? 0), 0) / 60))
    let topGenres = $derived(getTopGenres(playtime, libraryDetails, 4))
    let topGames = $derived(getTopPlayedGames(playtime, libraryDetails, 4))

    let statItems = $derived([
        { label: 'Hours this week', value: `${weekHours}`, detail: 'Across your recent Steam sessions', highlight: true },
        { label: 'Library explored', value: `${exploredPercent}%`, detail: `${playedCount} played · ${unplayedCount} untouched` },
        { label: 'Friends online', value: `${friends.filter((friend) => (friend.personastate ?? 0) > 0 || friend.gameid).length}`, detail: `${friends.filter((friend) => !!friend.gameid).length} in game right now` },
        { label: 'Total hours', value: `${totalHours}`, detail: `${libraryCount} owned games tracked` },
    ])

    async function loadRecommendations() {
        playLoading = true
        buyLoading = true

        playSuggestions = await algorithm.getPlaySuggestions()
        buySuggestions = await algorithm.getBuySuggestions()

        playLoading = false
        buyLoading = false
    }

    async function refreshPlay() {
        playLoading = true
        algorithm.invalidate('play')
        playSuggestions = await algorithm.getPlaySuggestions()
        playLoading = false
    }

    async function refreshBuy() {
        buyLoading = true
        algorithm.invalidate('buy')
        buySuggestions = await algorithm.getBuySuggestions()
        buyLoading = false
    }

    $effect(() => {
        const appid = heroGame?.appid ?? null
        if (!appid || loadedNewsAppid === appid) return

        loadedNewsAppid = appid
        steamAPI.getNewsForApp(appid, (payload) => {
            news = payload?.appnews?.newsitems?.slice(0, 4) ?? []
        })
    })

    onMount(() => {
        refreshFriends()
        loadRecommendations()
    })

    function feedback(item, liked) {
        algorithm.recordInteraction({ name: item.name }, liked)
    }
</script>

<div class="dashboard-page">
    <div class="main-column">
        {#if dashboardPrefs.showContinuePlaying !== false}
            <ContinuePlayingHero
                game={heroGame}
                detail={heroDetail}
                totalHours={Math.round((heroGame?.playtime_forever ?? 0) / 60)}
                weekHours={Math.round((heroGame?.playtime_2weeks ?? 0) / 60)}
            />
        {/if}

        {#if dashboardPrefs.showStats !== false}
            <SurfacePanel>
                <SectionHeader title="Library pulse" subtitle="The core signals GameSage is using right now." />
                <StatsGrid items={statItems} />
            </SurfacePanel>
        {/if}

        {#if dashboardPrefs.showRecentlyPlayed !== false}
            <SurfacePanel>
                <SectionHeader title="Recently played" subtitle="Compact session history with consistent game surfaces across the app." badge="Recent sessions" />
                {#if recentCards.length > 0}
                    <div class="recent-grid">
                        {#each recentCards as game (game.appid)}
                            <CompactActivityCard
                                appid={game.appid}
                                title={game.name}
                                detail={libraryDetails[game.appid]?.data ?? null}
                                eyebrow={game.hoursThisWeek > 0 ? `${game.hoursThisWeek}h this week` : 'Recently played'}
                                primaryMeta={game.totalHours > 0 ? `${game.totalHours}h total` : 'Unplayed'}
                                secondaryMeta={game.genres.join(' · ') || 'Steam library item'}
                                accentText={game.hoursThisWeek > 0 ? 'Active' : null}
                            />
                        {/each}
                    </div>
                {:else}
                    <EmptyState icon="clock-rotate-left" title="Recent sessions appear here once Steam sync finishes." description="GameSage reads your recently played list and turns it into compact cards so the dashboard stays readable at full width." compact />
                {/if}
            </SurfacePanel>
        {/if}

        {#if dashboardPrefs.showSuggestions !== false}
            <SurfacePanel>
                <RecommendationRail
                    title="Play next"
                    subtitle="Heuristic-first recommendations from your own library, with AI only improving the explanation layer."
                    badge="Owned games"
                    items={playSuggestions}
                    loading={playLoading}
                    onRefresh={refreshPlay}
                    emptyTitle="Play suggestions need synced library detail data."
                    emptyDescription="Once your library cache is hydrated, this rail ranks the best backlog candidates instead of waiting on AI to decide what exists."
                />
            </SurfacePanel>

            <SurfacePanel>
                <RecommendationRail
                    title="Worth buying"
                    subtitle="Store-side picks weighted by your current tastes, friend activity, and what is hot right now."
                    badge="Store picks"
                    items={buySuggestions}
                    kind="buy"
                    loading={buyLoading}
                    onRefresh={refreshBuy}
                    onFeedback={feedback}
                    emptyTitle="Buy suggestions are still warming up."
                    emptyDescription="GameSage blends featured Steam items and friend activity, then scores them against your library before AI writes the copy."
                />
            </SurfacePanel>
        {/if}

        {#if dashboardPrefs.showNews !== false}
            <SurfacePanel>
                <SectionHeader title="What is new" subtitle={heroGame ? `Latest updates around ${heroGame.name}.` : 'Latest updates for your most recent game.'} badge="Steam news" />
                {#if news.length > 0}
                    <div class="news-list">
                        {#each news as item (item.gid)}
                            <a class="news-item" href={item.url} target="_blank" rel="noopener noreferrer">
                                <strong>{item.title}</strong>
                                <span>{item.feedlabel}</span>
                            </a>
                        {/each}
                    </div>
                {:else}
                    <EmptyState icon="newspaper" title="Game news shows up here when Steam returns updates for your most recent game." compact />
                {/if}
            </SurfacePanel>
        {/if}
    </div>

    <aside class="side-column">
        {#if dashboardPrefs.showStats !== false && topGenres.length > 0}
            <SurfacePanel>
                <SectionHeader title="Top genres" subtitle="Where your library time is concentrated." compact />
                <div class="genre-list">
                    {#each topGenres as genre}
                        <div class="genre-row">
                            <strong>{genre.genre}</strong>
                            <span>{genre.hours}h</span>
                        </div>
                    {/each}
                </div>
            </SurfacePanel>
        {/if}

        {#if dashboardPrefs.showStats !== false && topGames.length > 0}
            <SurfacePanel>
                <SectionHeader title="Most played" subtitle="The anchors of your library profile." compact />
                <div class="top-games">
                    {#each topGames as game (game.appid)}
                        <CompactActivityCard
                            appid={game.appid}
                            title={game.detail.name}
                            detail={game.detail}
                            primaryMeta={`${game.hours}h total`}
                            secondaryMeta={game.detail?.genres?.[0]?.description ?? 'Steam game'}
                            showPlayButton={false}
                        />
                    {/each}
                </div>
            </SurfacePanel>
        {/if}

        {#if dashboardPrefs.showActivity !== false}
            <SurfacePanel>
                <SectionHeader title="Friend activity" subtitle="A compact snapshot of who is around right now." compact />
                {#if friends.length > 0}
                    <FriendSnapshot {friends} />
                {:else}
                    <EmptyState icon="users" title="Friend activity appears once Steam friend data is available." compact />
                {/if}
            </SurfacePanel>
        {/if}
    </aside>
</div>

<style>
    .dashboard-page {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(19rem, 0.95fr);
        gap: 1.2rem;
        align-items: start;
    }

    .main-column,
    .side-column,
    .recent-grid,
    .news-list,
    .genre-list,
    .top-games {
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

    .recent-grid {
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 0.95rem;
    }

    .news-list,
    .genre-list,
    .top-games {
        gap: 0.75rem;
    }

    .news-item {
        display: grid;
        gap: 0.3rem;
        padding: 0.95rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .news-item strong,
    .genre-row strong {
        font-size: 0.92rem;
        line-height: 1.45;
    }

    .news-item span,
    .genre-row span {
        color: var(--text-muted);
        font-size: 0.77rem;
    }

    .genre-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 0.95rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    @media (max-width: 1080px) {
        .dashboard-page {
            grid-template-columns: 1fr;
        }

        .side-column {
            position: static;
        }
    }
</style>
