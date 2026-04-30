<script>
    import { onMount, onDestroy } from 'svelte'
    import { db }                from '$lib/data'
    import { refreshFriends }    from '$lib/cache'

    // Left column
    import RecentSessions        from '$lib/components/dashboard-panels/RecentSessions.svelte'
    import TopGamesPlayed        from '$lib/components/dashboard-panels/TopGamesPlayed.svelte'
    import JoinFriends           from '$lib/components/dashboard-panels/JoinFriends.svelte'
    import GenreBreakdown        from '$lib/components/dashboard-panels/GenreBreakdown.svelte'
    import FriendGameFeed        from '$lib/components/dashboard-panels/FriendGameFeed.svelte'

    // Right column
    import ActiveFriendBreakdown from '$lib/components/dashboard-panels/ActiveFriendBreakdown.svelte'
    import FriendInsights        from '$lib/components/dashboard-panels/FriendInsights.svelte'
    import FriendActivityRecency from '$lib/components/dashboard-panels/FriendActivityRecency.svelte'
    import LibraryProfile        from '$lib/components/dashboard-panels/LibraryProfile.svelte'
    import FriendsList           from '$lib/components/dashboard-panels/FriendsList.svelte'

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let weekHours   = $derived(
        recentGames.reduce((sum, g) => sum + Math.round((g.playtime_2weeks ?? 0) / 60), 0)
    )

    let refreshInterval

    onMount(() => {
        refreshFriends()
        refreshInterval = setInterval(refreshFriends, 60_000)
    })

    onDestroy(() => clearInterval(refreshInterval))
</script>

<div class="page">
    <div class="page-header">
        <div class="page-title">Activity</div>
        <div class="stat-pills">
            {#if recentGames.length > 0}
                <div class="pill">
                    <i class="fa-solid fa-gamepad"></i>
                    {recentGames.length} game{recentGames.length !== 1 ? 's' : ''} this week
                </div>
            {/if}
            {#if weekHours > 0}
                <div class="pill accent">
                    <i class="fa-solid fa-clock"></i>
                    {weekHours}h this week
                </div>
            {/if}
        </div>
    </div>

    <div class="page-content">
        <div class="left">
            <RecentSessions />
            <TopGamesPlayed />
            <JoinFriends />
            <GenreBreakdown />
            <FriendGameFeed />
        </div>
        <div class="right">
            <ActiveFriendBreakdown />
            <FriendInsights />
            <FriendActivityRecency />
            <LibraryProfile />
            <FriendsList />
        </div>
    </div>
</div>

<style>
    .page { display: grid; gap: 1.2rem; }

    .page-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 20rem;
        gap: 2rem;
        align-items: start;
    }

    .left, .right {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
    }

    @media (max-width: 900px) {
        .page-content {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
