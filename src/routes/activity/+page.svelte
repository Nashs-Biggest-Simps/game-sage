<script>
    import { onMount, onDestroy } from 'svelte'
    import { db }                from '$lib/data'
    import { refreshFriends }    from '$lib/cache'
    import { resolve }           from '$app/paths'
    import { goto }              from '$app/navigation'
    import RecentlyPlayed from '$lib/components/mod/RecentlyPlayed.svelte';
    import TopGamesPlayed from '$lib/components/mod/TopGamesPlayed.svelte';
  import SmallActiveFriends from '$lib/components/mod/SmallActiveFriends.svelte';
  import PopularWithFriends from '$lib/components/mod/PopularWithFriends.svelte';
  import FriendActivity from '$lib/components/Home/FriendActivity.svelte';
  import FriendsList from '$lib/components/mod/FriendsList.svelte';

    // ── Personal data ─────────────────────────────────────────────────────────

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let playtime    = $derived($db?.cache?.library?.playtime    ?? {})
    let details     = $derived($db?.cache?.library?.details     ?? {})

    let weekHours = $derived(
        recentGames.reduce((sum, g) => sum + Math.round((g.playtime_2weeks ?? 0) / 60), 0)
    )

    let topGames = $derived(() => {
        const entries = Object.entries(playtime)
            .filter(([id, mins]) => mins > 0 && details[id]?.data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, mins]) => ({
                appid: parseInt(id),
                hours: Math.round(mins / 60),
                detail: details[id].data,
            }))
        const maxHours = entries[0]?.hours ?? 1
        return entries.map(g => ({ ...g, pct: Math.round((g.hours / maxHours) * 100) }))
    })

    // ── Image fallback ────────────────────────────────────────────────────────

    function makeImgState(id, detail = null) {
        const urls = [
            detail?.header_image ?? null,
            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`,
            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
        ].filter(Boolean)
        let idx = $state(0)
        return {
            get src()    { return urls[idx] ?? null },
            get failed() { return idx >= urls.length },
            next()       { idx++ },
        }
    }

    // ── Friends ───────────────────────────────────────────────────────────────

    const STATE_LABEL = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Trade', 'Play']

    let friends        = $derived($db?.cache?.friends?.data ?? [])
    let friendsLoading = $derived($db?.cache?.friends == null)
    let showOffline    = $state(false)
    let feedExpanded   = $state(false)

    const FEED_LIMIT = 10

    let inGame  = $derived(friends.filter(f => f.gameid))
    let online  = $derived(friends.filter(f => !f.gameid && f.personastate > 0))
    let offline = $derived(friends.filter(f => !f.gameid && f.personastate === 0))

    // Feed = in-game first, then online; no offline
    let activeFeed    = $derived([...inGame, ...online])
    let feedVisible   = $derived(feedExpanded ? activeFeed : activeFeed.slice(0, FEED_LIMIT))
    let feedOverflow  = $derived(activeFeed.length - FEED_LIMIT)

    // Aggregate games by how many friends are playing them right now
    let popularGames = $derived(() => {
        const map = {}
        for (const f of inGame) {
            if (!f.gameid) continue
            if (!map[f.gameid]) map[f.gameid] = { gameid: f.gameid, name: f.gameextrainfo, friends: [] }
            map[f.gameid].friends.push(f)
        }
        return Object.values(map).sort((a, b) => b.friends.length - a.friends.length)
    })

    function timeAgo(unix) {
        if (!unix) return ''
        const secs = Math.floor(Date.now() / 1000) - unix
        if (secs < 60)     return 'just now'
        if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return `${Math.floor(secs / 604800)}w ago`
    }

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
        <h1 class="page-title">Activity</h1>
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
            <section class="panel">
                <div class="row-header">
                    <div class="row-title">Recently Played</div>
                </div>
                <RecentlyPlayed style="grid" />
            </section>
    
            {#if topGames().length > 0}
            <section class="panel">
                <div class="row-header">
                    <div class="row-title">Top Games Played</div>
                </div>
                <TopGamesPlayed />
            </section>
            {/if}
        </div>
        <div class="right">
            {#if !friendsLoading && friends.length > 0}
                <SmallActiveFriends />
            {/if}

            <div class="panel">
                <div class="panel-title">
                    <i class="fa-solid fa-fire"></i>
                    Popular with Friends
                </div>
                <PopularWithFriends />
            </div>

            <!-- Friends panel: in-game + online list, offline collapsed -->
            <div class="panel friends-panel">
                <div class="panel-title-row">
                    <div class="panel-title">
                        <i class="fa-solid fa-user-group"></i>
                        Friends
                    </div>
                    {#if !friendsLoading}
                        <div class="feed-counts">
                            {#if inGame.length > 0}
                                <span class="fc in-game">{inGame.length} playing</span>
                            {/if}
                            {#if online.length > 0}
                                <span class="fc online">{online.length} online</span>
                            {/if}
                        </div>
                    {/if}
                </div>

                <FriendsList />
            </div>
        </div>
    </div>
</div>

<style>
    .page{
        display: grid;
        gap: 1.2rem;
    }
    .page-header {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        flex-wrap: wrap;
    }

    .page-content{
        display: grid;
        grid-template-columns: minmax(0, 1fr) 18rem;
        gap: 2rem;
        align-items: start;
    }

    .page-content .left  { display: flex; flex-direction: column; gap: 1.6rem; }
    .page-content .right { display: flex; flex-direction: column; gap: 1.6rem; }

    @media (orientation: portrait) {
        .page-content{
            grid-template-columns: minmax(0, 1fr);
        }
    }

    .page-title {
        all: unset;
        font-size: 2rem;
        font-weight: 800;
    }

    .panel-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .feed-counts { display: flex; gap: 0.35rem; }

    .fc {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 100vh;
    }
    .fc.in-game { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .fc.online  { background: hsl(130,40%,14%); color: hsl(130,55%,55%); outline: solid 1pt hsl(130,40%,26%); }
    .friends-panel { gap: 0.1rem; }
</style>
