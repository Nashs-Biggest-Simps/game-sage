<script>
    import { onMount } from 'svelte'
    import { db } from '$lib/data'
    import { refreshFriends } from '$lib/cache'
    import {
        getFriendBuckets,
        getPopularFriendGames,
        getRecentSummaries,
        getTopPlayedGames,
        getTotalMinutes,
    } from '$lib/insights'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import SectionHeader from '$lib/components/layout/SectionHeader.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import StatsGrid from '$lib/components/Dashboard/StatsGrid.svelte'
    import CompactActivityCard from '$lib/components/cards/CompactActivityCard.svelte'

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let libraryDetails = $derived($db?.cache?.library?.details ?? {})
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let friends = $derived($db?.cache?.friends?.data ?? [])

    let recentCards = $derived(getRecentSummaries(recentGames, libraryDetails))
    let topGames = $derived(getTopPlayedGames(playtime, libraryDetails, 5))
    let buckets = $derived(getFriendBuckets(friends))
    let popularFriendGames = $derived(getPopularFriendGames(friends).slice(0, 5))
    let weekHours = $derived(Math.round(recentGames.reduce((total, game) => total + (game.playtime_2weeks ?? 0), 0) / 60))
    let totalHours = $derived(Math.round(getTotalMinutes(playtime) / 60))

    let statItems = $derived([
        { label: 'Hours this week', value: `${weekHours}`, detail: `${recentCards.length} recent sessions`, highlight: true },
        { label: 'Friends online', value: `${buckets.online.length + buckets.inGame.length}`, detail: `${buckets.inGame.length} are in game right now` },
        { label: 'Top sessions', value: `${topGames.length}`, detail: 'Most-played anchors in your library' },
        { label: 'Total hours', value: `${totalHours}`, detail: 'Lifetime Steam playtime from synced library data' },
    ])

    onMount(() => {
        refreshFriends()
    })
</script>

<div class="activity-page">
    <div class="main-column">
        <PageHeader
            eyebrow="Social and recent activity"
            title="See the shape of your recent playtime without giant oversized cards."
            description="The activity page keeps your recent sessions compact, then spends the rest of the space on friend presence, library anchors, and the games orbiting your social graph."
        />

        <SurfacePanel>
            <SectionHeader title="Weekly snapshot" subtitle="Fast signals from your recent sessions and your social graph." />
            <StatsGrid items={statItems} />
        </SurfacePanel>

        <SurfacePanel>
            <SectionHeader title="Recently played" subtitle="Smaller cards keep the section readable even on large screens." badge="Compact sessions" />
            {#if recentCards.length > 0}
                <div class="recent-grid">
                    {#each recentCards as game (game.appid)}
                        <CompactActivityCard
                            appid={game.appid}
                            title={game.name}
                            detail={libraryDetails[game.appid]?.data ?? null}
                            eyebrow={game.hoursThisWeek > 0 ? `${game.hoursThisWeek}h this week` : 'Recent'}
                            primaryMeta={game.totalHours > 0 ? `${game.totalHours}h total` : 'Unplayed'}
                            secondaryMeta={game.genres.join(' · ') || 'Steam library item'}
                            accentText={game.hoursThisWeek > 0 ? 'Active' : null}
                        />
                    {/each}
                </div>
            {:else}
                <EmptyState icon="clock-rotate-left" title="Recent sessions will appear here after the next Steam sync." compact />
            {/if}
        </SurfacePanel>

        <SurfacePanel>
            <SectionHeader title="Top games all time" subtitle="The games that define your play history." badge="Long-term anchors" />
            {#if topGames.length > 0}
                <div class="top-grid">
                    {#each topGames as game (game.appid)}
                        <CompactActivityCard
                            appid={game.appid}
                            title={game.detail.name}
                            detail={game.detail}
                            primaryMeta={`${game.hours}h total`}
                            secondaryMeta={game.detail?.genres?.[0]?.description ?? 'Steam library item'}
                            accentText={game.hours >= 100 ? 'Heavy rotation' : null}
                            showPlayButton={false}
                        />
                    {/each}
                </div>
            {:else}
                <EmptyState icon="trophy" title="Top-played data needs your library cache to finish syncing." compact />
            {/if}
        </SurfacePanel>
    </div>

    <aside class="side-column">
        <SurfacePanel>
            <SectionHeader title="Friend presence" subtitle="Who is around right now." compact />
            {#if friends.length > 0}
                <div class="presence-grid">
                    <div><strong>{friends.length}</strong><span>total friends</span></div>
                    <div><strong>{buckets.online.length + buckets.inGame.length}</strong><span>online</span></div>
                    <div><strong>{buckets.inGame.length}</strong><span>in game</span></div>
                </div>
            {:else}
                <EmptyState icon="users" title="Friend presence shows up when Steam friend data is available." compact />
            {/if}
        </SurfacePanel>

        <SurfacePanel>
            <SectionHeader title="Popular with friends" subtitle="Games clustering around your friend activity." compact />
            {#if popularFriendGames.length > 0}
                <div class="friend-games">
                    {#each popularFriendGames as game (game.appid)}
                        <CompactActivityCard
                            appid={game.appid}
                            title={game.name}
                            eyebrow="Friends playing"
                            primaryMeta={`${game.friends.length} friend${game.friends.length !== 1 ? 's' : ''} active`}
                            secondaryMeta={game.friends.slice(0, 3).map((friend) => friend.personaname).join(' · ')}
                            showPlayButton={false}
                        />
                    {/each}
                </div>
            {:else}
                <EmptyState icon="fire" title="None of your friends are clustered around a game right now." compact />
            {/if}
        </SurfacePanel>
    </aside>
</div>

<style>
    .activity-page {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.9fr);
        gap: 1.2rem;
        align-items: start;
    }

    .main-column,
    .side-column,
    .recent-grid,
    .top-grid,
    .friend-games {
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

    .recent-grid,
    .top-grid,
    .friend-games {
        gap: 0.95rem;
    }

    .recent-grid {
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    }

    .presence-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.8rem;
    }

    .presence-grid div {
        display: grid;
        gap: 0.2rem;
        padding: 0.95rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .presence-grid strong {
        font-size: 1.25rem;
    }

    .presence-grid span {
        color: var(--text-muted);
        font-size: 0.76rem;
    }

    @media (max-width: 1080px) {
        .activity-page {
            grid-template-columns: 1fr;
        }

        .side-column {
            position: static;
        }
    }
</style>
