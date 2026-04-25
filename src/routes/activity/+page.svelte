<script>
    import { onMount, onDestroy } from 'svelte'
    import { db }                from '$lib/data'
    import { refreshFriends }    from '$lib/cache'
    import { resolve }           from '$app/paths'
    import { goto }              from '$app/navigation'
    // Left Column
    import TopGamesPlayed from '$lib/components/panel-sections/TopGamesPlayed.svelte';
    // Right Column
    import ActiveFriendBreakdown from '$lib/components/panel-sections/ActiveFriendBreakdown.svelte'
    import PopularWithFriends from '$lib/components/panel-sections/PopularWithFriends.svelte';
    import FriendsList from '$lib/components/panel-sections/FriendsList.svelte';

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let playtime    = $derived($db?.cache?.library?.playtime    ?? {})
    let details     = $derived($db?.cache?.library?.details     ?? {})

    let weekHours = $derived(
        recentGames.reduce((sum, g) => sum + Math.round((g.playtime_2weeks ?? 0) / 60), 0)
    )

    let refreshInterval

    onMount(() => {
        refreshFriends()
        refreshInterval = setInterval(refreshFriends, 60_000)
    })

    onDestroy(() => {
        clearInterval(refreshInterval)
    })
</script>

<div class="page">
    <div class="page-header">
        <div class="page-title">Activity</div>
        <div class="stat-pills">
            {#if recentGames.length > 0}
                <div class="pill"><i class="fa-solid fa-gamepad"></i>{recentGames.length} game{recentGames.length !== 1 ? 's' : ''} this week</div>
            {/if}
            {#if weekHours > 0}
                <div class="pill accent"><i class="fa-solid fa-clock"></i>{weekHours}h this week</div>
            {/if}
        </div>
    </div>
    
    <div class="page-content">
        <div class="left">
            <TopGamesPlayed />
        </div>
        <div class="right">
            <ActiveFriendBreakdown />
            <PopularWithFriends />
            <FriendsList />
        </div>
    </div>
</div>

<style>
    .page{
        display: grid;
        gap: 1.2rem;
    }

    .page-content{
        display: grid;
        grid-template-columns: minmax(0, 1fr) 18rem;
        gap: 2rem;
        align-items: start;
    }

    .page-content > *  { display: flex; flex-direction: column; gap: 1.6rem; }

    @media (orientation: portrait) {
        .page-content{
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
