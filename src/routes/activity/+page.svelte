<script>
    import { onMount } from 'svelte'
    import { db }      from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { resolve } from '$app/paths'
    import { goto }    from '$app/navigation'

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

    let friends        = $state([])
    let friendsLoading = $state(true)
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

    onMount(() => {
        steamAPI.getFriendList(data => {
            const ids = (data?.friendslist?.friends ?? []).map(f => f.steamid)
            if (!ids.length) { friendsLoading = false; return }
            steamAPI.getPlayerSummaries(ids.slice(0, 100), res => {
                const players = res?.response?.players ?? []
                friends = players.sort((a, b) => {
                    const sa = a.gameid ? 2 : a.personastate > 0 ? 1 : 0
                    const sb = b.gameid ? 2 : b.personastate > 0 ? 1 : 0
                    if (sa !== sb) return sb - sa
                    return (b.lastlogoff ?? 0) - (a.lastlogoff ?? 0)
                })
                friendsLoading = false
            })
        })
    })
</script>

<div class="page">

    <!-- ── Left: personal activity ───────────────────────────────── -->
    <main class="main">

        <div class="page-header">
            <h1 class="page-title">Activity</h1>
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

        <!-- Recently Played — 2×2 grid -->
        <section class="panel">
            <div class="panel-title">
                <i class="fa-solid fa-rotate-left"></i>
                Recently Played
            </div>

            {#if recentGames.length === 0}
                <div class="empty-row">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Loading recent sessions…</span>
                </div>
            {:else}
                <div class="recent-grid">
                    {#each recentGames as g (g.appid)}
                        {@const detail  = details[g.appid]?.data ?? null}
                        {@const img     = makeImgState(g.appid, detail)}
                        {@const weekH   = Math.round((g.playtime_2weeks ?? 0) / 60)}
                        {@const totalH  = Math.round(g.playtime_forever / 60)}
                        <div
                            class="rc-card"
                            role="button"
                            tabindex="0"
                            onclick={() => goto(resolve(`/view?id=${g.appid}`))}
                            onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.appid}`))}
                        >
                            <div class="rc-art">
                                {#if img.src && !img.failed}
                                    <img src={img.src} alt={g.name} loading="lazy" onerror={() => img.next()} />
                                {:else}
                                    <div class="rc-art-fallback"></div>
                                {/if}
                                <div class="rc-overlay">
                                    <button
                                        class="rc-play"
                                        aria-label="Play {g.name}"
                                        onclick={(e) => { e.stopPropagation(); window.location.href = `steam://run/${g.appid}` }}
                                    >
                                        <i class="fa-solid fa-play"></i>
                                    </button>
                                </div>
                                {#if weekH > 0}
                                    <div class="rc-badge">
                                        <i class="fa-solid fa-fire"></i>
                                        {weekH}h this week
                                    </div>
                                {/if}
                            </div>
                            <div class="rc-info">
                                <div class="rc-name">{g.name}</div>
                                <div class="rc-stats">
                                    <span class="rc-total">
                                        <i class="fa-solid fa-clock"></i>
                                        {totalH > 0 ? `${totalH.toLocaleString()}h total` : 'Unplayed'}
                                    </span>
                                    {#if detail?.genres?.length}
                                        <span class="rc-genre">{detail.genres[0].description}</span>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

        <!-- Top Games All Time -->
        {#if topGames().length > 0}
        <section class="panel">
            <div class="panel-title">
                <i class="fa-solid fa-trophy"></i>
                Top Games All Time
            </div>
            <div class="top-list">
                {#each topGames() as g, i (g.appid)}
                    {@const img = makeImgState(g.appid, g.detail)}
                    <div
                        class="top-row"
                        role="button"
                        tabindex="0"
                        onclick={() => goto(resolve(`/view?id=${g.appid}`))}
                        onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.appid}`))}
                    >
                        <div class="rank">{i + 1}</div>
                        <div class="top-art">
                            {#if img.src && !img.failed}
                                <img src={img.src} alt={g.detail.name} loading="lazy" onerror={() => img.next()} />
                            {:else}
                                <div class="top-art-fallback"></div>
                            {/if}
                        </div>
                        <div class="top-info">
                            <div class="top-name">{g.detail.name}</div>
                            <div class="top-bar-wrap">
                                <div class="top-bar" style="width: {g.pct}%"></div>
                            </div>
                        </div>
                        <div class="top-hours">{g.hours.toLocaleString()}h</div>
                    </div>
                {/each}
            </div>
        </section>
        {/if}

    </main>

    <!-- ── Right: friends ────────────────────────────────────────── -->
    <aside class="sidebar">

        <!-- Friend Summary Stats -->
        {#if !friendsLoading && friends.length > 0}
        <div class="stat-bar">
            <div class="stat-item">
                <div class="stat-num">{friends.length}</div>
                <div class="stat-lbl">Friends</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item accent">
                <div class="stat-num">{inGame.length + online.length}</div>
                <div class="stat-lbl">Online</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item ingame">
                <div class="stat-num">{inGame.length}</div>
                <div class="stat-lbl">In-Game</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item dim">
                <div class="stat-num">{offline.length}</div>
                <div class="stat-lbl">Offline</div>
            </div>
        </div>
        {/if}

        <!-- Popular with Friends -->
        {#if popularGames().length > 0}
        <div class="panel">
            <div class="panel-title">
                <i class="fa-solid fa-fire"></i>
                Popular with Friends
            </div>
            <div class="pop-list">
                {#each popularGames() as game (game.gameid)}
                    <div class="pop-row">
                        <div class="pop-art"
                            style="background-image: url('https://cdn.akamai.steamstatic.com/steam/apps/{game.gameid}/capsule_231x87.jpg')"
                        ></div>
                        <div class="pop-info">
                            <div class="pop-name">{game.name}</div>
                            <div class="pop-count">
                                {game.friends.length} friend{game.friends.length !== 1 ? 's' : ''} playing
                            </div>
                        </div>
                        <div class="pop-avatars">
                            {#each game.friends.slice(0, 3) as f (f.steamid)}
                                <img class="pop-av" src={f.avatarmedium} alt={f.personaname} title={f.personaname} loading="lazy" />
                            {/each}
                            {#if game.friends.length > 3}
                                <div class="pop-av-more">+{game.friends.length - 3}</div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
        {:else if friendsLoading}
        <div class="panel">
            <div class="panel-title">
                <i class="fa-solid fa-fire"></i>
                Popular with Friends
            </div>
            {#each Array(3) as _}
                <div class="friend-skeleton"></div>
            {/each}
        </div>
        {:else}
        <div class="panel">
            <div class="panel-title">
                <i class="fa-solid fa-fire"></i>
                Popular with Friends
            </div>
            <div class="empty-row">
                <i class="fa-solid fa-moon"></i>
                <span>No friends in a game right now</span>
            </div>
        </div>
        {/if}

        <!-- Playing Now: visual game art cards -->
        {#if inGame.length > 0}
        <div class="panel now-panel">
            <div class="panel-title">
                <i class="fa-solid fa-gamepad"></i>
                Playing Now
                <span class="panel-count">{inGame.length}</span>
            </div>
            {#each inGame as f (f.steamid)}
                <div
                    class="now-card"
                    style="background-image: url('https://cdn.akamai.steamstatic.com/steam/apps/{f.gameid}/header.jpg')"
                >
                    <div class="now-art-overlay">
                        <img class="now-av" src={f.avatarmedium} alt="" loading="lazy" />
                        <div class="now-text">
                            <div class="now-name">{f.personaname}</div>
                            <div class="now-game">{f.gameextrainfo}</div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        {/if}

        <!-- Activity Feed: active friends only, capped at 10 -->
        <div class="panel activity-feed-panel">
            <div class="panel-title-row">
                <div class="panel-title">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Activity Feed
                </div>
                {#if !friendsLoading && activeFeed.length > 0}
                    <div class="feed-counts">
                        {#if inGame.length > 0}
                            <span class="fc in-game">{inGame.length} in-game</span>
                        {/if}
                        {#if online.length > 0}
                            <span class="fc online">{online.length} online</span>
                        {/if}
                    </div>
                {/if}
            </div>

            {#if friendsLoading}
                {#each Array(5) as _}
                    <div class="friend-skeleton"></div>
                {/each}
            {:else if activeFeed.length === 0}
                <div class="empty-row">
                    <i class="fa-solid fa-moon"></i>
                    <span>No friends are active right now</span>
                </div>
            {:else}
                <div class="af-list">
                    {#each feedVisible as f (f.steamid)}
                        {@const statusClass = f.gameid ? 'in-game' : 'online'}
                        <div class="af-row {statusClass}">
                            <div class="av-wrap">
                                <img class="av" src={f.avatarmedium} alt="" loading="lazy" />
                                <div class="dot"></div>
                            </div>
                            <div class="af-body">
                                <div class="af-name">{f.personaname}</div>
                                <div class="af-action {f.gameid ? 'playing' : ''}">
                                    {#if f.gameid}
                                        <i class="fa-solid fa-gamepad"></i>
                                        {f.gameextrainfo}
                                    {:else}
                                        <i class="fa-solid fa-circle"></i>
                                        {STATE_LABEL[f.personastate ?? 1]}
                                    {/if}
                                </div>
                            </div>
                            <div class="af-time">
                                {f.gameid ? 'playing' : 'now'}
                            </div>
                        </div>
                    {/each}
                </div>

                {#if feedOverflow > 0 && !feedExpanded}
                    <button class="expand-btn" onclick={() => feedExpanded = true}>
                        <i class="fa-solid fa-chevron-down"></i>
                        Show {feedOverflow} more
                    </button>
                {:else if feedExpanded && activeFeed.length > FEED_LIMIT}
                    <button class="expand-btn" onclick={() => feedExpanded = false}>
                        <i class="fa-solid fa-chevron-up"></i>
                        Show less
                    </button>
                {/if}

                <!-- Offline: just a count row, no list -->
                {#if offline.length > 0}
                    <div class="offline-summary">
                        <i class="fa-solid fa-circle offline-dot"></i>
                        {offline.length} friend{offline.length !== 1 ? 's' : ''} offline
                    </div>
                {/if}
            {/if}
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
                            <span class="fc in-game">{inGame.length}</span>
                        {/if}
                        {#if online.length > 0}
                            <span class="fc online">{online.length}</span>
                        {/if}
                    </div>
                {/if}
            </div>

            {#if friendsLoading}
                {#each Array(5) as _}
                    <div class="friend-skeleton"></div>
                {/each}

            {:else if friends.length === 0}
                <div class="empty-row">
                    <i class="fa-solid fa-user-group"></i>
                    <span>Friends list may be private</span>
                </div>

            {:else}
                {#if inGame.length > 0}
                    <div class="group-label">In Game</div>
                    {#each inGame as f (f.steamid)}
                        <div class="friend in-game">
                            <div class="av-wrap">
                                <img class="av" src={f.avatarmedium} alt="" loading="lazy" />
                                <div class="dot"></div>
                            </div>
                            <div class="f-info">
                                <div class="f-name">{f.personaname}</div>
                                <div class="f-game">
                                    <i class="fa-solid fa-gamepad"></i>
                                    {f.gameextrainfo}
                                </div>
                            </div>
                            <div class="f-side">
                                <div class="f-game-thumb"
                                    style="background-image: url('https://cdn.akamai.steamstatic.com/steam/apps/{f.gameid}/capsule_231x87.jpg')"
                                ></div>
                            </div>
                        </div>
                    {/each}
                {/if}

                {#if online.length > 0}
                    <div class="group-label">Online</div>
                    {#each online as f (f.steamid)}
                        <div class="friend online">
                            <div class="av-wrap">
                                <img class="av" src={f.avatarmedium} alt="" loading="lazy" />
                                <div class="dot"></div>
                            </div>
                            <div class="f-info">
                                <div class="f-name">{f.personaname}</div>
                                <div class="f-status">{STATE_LABEL[f.personastate ?? 0]}</div>
                            </div>
                        </div>
                    {/each}
                {/if}

                {#if offline.length > 0}
                    <button class="offline-toggle" onclick={() => showOffline = !showOffline}>
                        <i class="fa-solid fa-chevron-{showOffline ? 'up' : 'down'}"></i>
                        {showOffline ? 'Hide' : 'Show'} {offline.length} offline
                    </button>
                    {#if showOffline}
                        {#each offline.slice(0, 20) as f (f.steamid)}
                            <div class="friend offline">
                                <div class="av-wrap">
                                    <img class="av" src={f.avatarmedium} alt="" loading="lazy" />
                                    <div class="dot"></div>
                                </div>
                                <div class="f-info">
                                    <div class="f-name">{f.personaname}</div>
                                    <div class="f-status">{f.lastlogoff ? timeAgo(f.lastlogoff) : 'Offline'}</div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                {/if}
            {/if}
        </div>

    </aside>

</div>

<style>
    .page {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 18rem;
        gap: 2rem;
        align-items: start;
    }

    .main    { display: flex; flex-direction: column; gap: 1.6rem; }
    .sidebar { display: flex; flex-direction: column; gap: 1.4rem; position: sticky; top: 2.4rem; }

    /* ── Page header ─────────────── */

    .page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .page-title {
        font-size: 2rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.02em;
    }

    .stat-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .pill {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.75rem;
        background: var(--l1);
        border-radius: 100vh;
        outline: solid 1pt var(--l3);
        font-size: 0.78rem;
        font-weight: 600;
        opacity: 0.75;
    }

    .pill.accent {
        background: var(--la1);
        outline-color: var(--la3);
        color: var(--bright-accent);
        opacity: 1;
    }

    .pill i { font-size: 0.72rem; }

    /* ── Panels ──────────────────── */

    .panel {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .panel-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.5;
    }

    .panel-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .panel-count {
        margin-left: 0.3rem;
        background: var(--la1);
        color: var(--bright-accent);
        border-radius: 100vh;
        padding: 0.05rem 0.45rem;
        font-size: 0.65rem;
    }

    /* ── Recently Played 2×2 grid ── */

    .recent-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .rc-card {
        display: flex;
        flex-direction: column;
        border-radius: 0.8rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l2);
        cursor: pointer;
        transition: transform 160ms, outline-color 160ms, box-shadow 160ms;
    }

    .rc-card:hover {
        transform: translateY(-3px);
        outline-color: var(--accent);
        box-shadow: 0 8px 24px hsl(0, 0%, 0%, 0.3);
    }

    .rc-art {
        position: relative;
        aspect-ratio: 616 / 353;
        overflow: hidden;
        background: var(--l2);
    }

    .rc-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .rc-card:hover .rc-art img { transform: scale(1.05); }

    .rc-art-fallback { width: 100%; height: 100%; background: var(--l2); }

    .rc-badge {
        position: absolute;
        top: 0.4rem;
        left: 0.4rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.18rem 0.5rem;
        background: hsl(0, 0%, 0%, 0.72);
        backdrop-filter: blur(5px);
        border-radius: 100vh;
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--bright-accent);
    }

    .rc-badge i { font-size: 0.55rem; }

    .rc-overlay {
        position: absolute;
        inset: 0;
        background: hsl(0, 0%, 0%, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 150ms;
    }

    .rc-card:hover .rc-overlay { opacity: 1; }

    .rc-play {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        color: white;
        cursor: pointer;
        transition: background 120ms, transform 100ms;
    }

    .rc-play:hover { background: var(--bright-accent); transform: scale(1.1); }

    .rc-info {
        padding: 0.65rem 0.8rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .rc-name {
        font-size: 0.88rem;
        font-weight: 700;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .rc-stats {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
    }

    .rc-total {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.55;
    }

    .rc-total i { font-size: 0.65rem; }

    .rc-genre {
        font-size: 0.68rem;
        padding: 0.15rem 0.45rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.7;
    }

    /* ── Top games list ──────────── */

    .top-list { display: flex; flex-direction: column; gap: 0.15rem; }

    .top-row {
        display: grid;
        grid-template-columns: 1.6rem 3.2rem 1fr auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.5rem 0.4rem;
        border-radius: 0.6rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .top-row:hover { background: var(--l1); }

    .rank { font-size: 0.72rem; font-weight: 700; opacity: 0.35; text-align: center; }

    .top-art {
        width: 3.2rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.35rem;
        overflow: hidden;
        background: var(--l2);
    }

    .top-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .top-art-fallback { width: 100%; height: 100%; background: var(--l3); }

    .top-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }

    .top-name {
        font-size: 0.84rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .top-bar-wrap {
        height: 3px;
        background: var(--l3);
        border-radius: 100vh;
        overflow: hidden;
    }

    .top-bar {
        height: 100%;
        background: var(--accent);
        border-radius: 100vh;
        transition: width 600ms ease;
    }

    .top-hours { font-size: 0.78rem; font-weight: 700; opacity: 0.65; white-space: nowrap; }

    /* ── Playing Now cards ──────────── */

    .now-panel { gap: 0.5rem; }

    .now-card {
        border-radius: 0.65rem;
        overflow: hidden;
        background: var(--l2);
        background-size: cover;
        background-position: center;
        aspect-ratio: 460 / 215;
        position: relative;
        flex-shrink: 0;
    }

    .now-art-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, hsl(0,0%,0%,0.85) 0%, transparent 55%);
        display: flex;
        align-items: flex-end;
        gap: 0.55rem;
        padding: 0.55rem 0.65rem;
    }

    .now-av {
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 0.3rem;
        object-fit: cover;
        flex-shrink: 0;
        outline: 1.5pt solid hsl(0,0%,100%,0.3);
    }

    .now-text { min-width: 0; }

    .now-name {
        font-size: 0.75rem;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .now-game {
        font-size: 0.65rem;
        color: var(--bright-accent);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 0.05rem;
    }

    /* ── Activity Feed ───────────── */

    .activity-feed-panel { gap: 0.4rem; }

    .feed-counts { display: flex; gap: 0.35rem; }

    .fc {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 100vh;
    }

    .fc.in-game { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .fc.online  { background: hsl(130,40%,14%); color: hsl(130,55%,55%); outline: solid 1pt hsl(130,40%,26%); }

    .af-list { display: flex; flex-direction: column; gap: 0.05rem; }

    .af-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.55rem;
        padding: 0.4rem 0.5rem;
        border-radius: 0.55rem;
        align-items: center;
        transition: background 120ms;
    }

    .af-row:hover  { background: var(--l1); }
    .af-row.in-game { background: var(--la1); }
    .af-row.in-game:hover { background: var(--la2); }

    .af-body { min-width: 0; }

    .af-name {
        font-size: 0.78rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .af-action {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.68rem;
        opacity: 0.5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .af-action.playing { color: var(--bright-accent); opacity: 0.9; }
    .af-action i { font-size: 0.58rem; flex-shrink: 0; }

    .af-time {
        font-size: 0.62rem;
        opacity: 0.38;
        white-space: nowrap;
    }

    .in-game .af-time { opacity: 0.7; color: var(--bright-accent); }

    .expand-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.45rem;
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.45;
        cursor: pointer;
        border-radius: 0.5rem;
        color: inherit;
        transition: background 120ms, opacity 120ms;
        margin-top: 0.1rem;
    }

    .expand-btn:hover { background: var(--l1); opacity: 0.9; }
    .expand-btn i { font-size: 0.6rem; }

    .offline-summary {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.72rem;
        opacity: 0.35;
        padding: 0.15rem 0.5rem;
        margin-top: 0.1rem;
    }

    .offline-dot { font-size: 0.5rem; }

    /* ── Friends panel ───────────── */

    .friends-panel { gap: 0.1rem; }

    .group-label {
        font-size: 0.64rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.35;
        padding: 0.6rem 0.4rem 0.15rem;
    }

    .friend {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.65rem;
        padding: 0.45rem 0.55rem;
        border-radius: 0.6rem;
        align-items: center;
        transition: background 120ms;
    }

    .friend:hover { background: var(--l1); }
    .friend.in-game { background: var(--la1); }
    .friend.in-game:hover { background: var(--la2); }
    .friend.offline { opacity: 0.4; }

    .av-wrap {
        position: relative;
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
    }

    .av {
        width: 100%;
        height: 100%;
        border-radius: 0.35rem;
        object-fit: cover;
        display: block;
        background: var(--l3);
    }

    .dot {
        position: absolute;
        bottom: -0.15rem;
        right: -0.15rem;
        width: 0.6rem;
        height: 0.6rem;
        border-radius: 50%;
        border: 2px solid var(--lb0);
        background: var(--l4);
    }

    .in-game .dot { background: var(--accent); border-color: var(--la1); }
    .online  .dot { background: hsl(130,55%,45%); }

    .f-info { min-width: 0; }

    .f-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .f-game {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.71rem;
        color: var(--bright-accent);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .f-game i { font-size: 0.65rem; flex-shrink: 0; }

    .f-status { font-size: 0.71rem; opacity: 0.5; }

    /* Game thumbnail for in-game friends */
    .f-side { flex-shrink: 0; }

    .f-game-thumb {
        width: 3.2rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        background: var(--l2);
        background-size: cover;
        background-position: center;
        opacity: 0.8;
    }

    .offline-toggle {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.75rem;
        opacity: 0.4;
        cursor: pointer;
        padding: 0.5rem 0.55rem;
        border-radius: 0.5rem;
        color: inherit;
        transition: background 120ms, opacity 120ms;
        margin-top: 0.25rem;
    }

    .offline-toggle:hover { background: var(--l1); opacity: 0.8; }
    .offline-toggle i { font-size: 0.65rem; }

    /* ── Shared empty / skeleton ─── */

    .empty-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 1rem 0.4rem;
        font-size: 0.82rem;
        opacity: 0.4;
    }

    .friend-skeleton {
        height: 2.8rem;
        border-radius: 0.6rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* ── Friend Summary stat bar ─── */

    .stat-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--lb0);
        border-radius: 1rem;
        outline: solid 1pt var(--l3);
        padding: 0.85rem 1rem;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        flex: 1;
    }

    .stat-num {
        font-size: 1.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1;
    }

    .stat-lbl {
        font-size: 0.62rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.45;
    }

    .stat-item.accent .stat-num { color: hsl(130,55%,55%); }
    .stat-item.ingame .stat-num { color: var(--bright-accent); }
    .stat-item.dim    .stat-num { opacity: 0.4; }

    .stat-divider {
        width: 1pt;
        height: 2rem;
        background: var(--l3);
        flex-shrink: 0;
    }

    /* ── Popular with Friends ───── */

    .pop-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .pop-row {
        display: grid;
        grid-template-columns: 3.6rem 1fr auto;
        gap: 0.7rem;
        align-items: center;
        padding: 0.45rem 0.4rem;
        border-radius: 0.6rem;
        transition: background 120ms;
        cursor: default;
    }

    .pop-row:hover { background: var(--l1); }

    .pop-art {
        width: 3.6rem;
        height: 1.7rem;
        border-radius: 0.35rem;
        background: var(--l2);
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
    }

    .pop-info { min-width: 0; }

    .pop-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pop-count {
        font-size: 0.68rem;
        opacity: 0.5;
        margin-top: 0.08rem;
    }

    .pop-avatars {
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        flex-shrink: 0;
    }

    .pop-av {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        object-fit: cover;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }

    .pop-av:first-child { margin-left: 0; }

    .pop-av-more {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.58rem;
        font-weight: 700;
        opacity: 0.7;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }
</style>
