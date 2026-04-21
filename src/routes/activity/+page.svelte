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

    function makeImgState(id) {
        const urls = [
            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`,
            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
        ]
        let idx = $state(0)
        return {
            get src()    { return urls[idx] ?? null },
            get failed() { return idx >= urls.length },
            next()       { idx++ },
        }
    }

    // ── Friends ───────────────────────────────────────────────────────────────

    const STATE_LABEL = ['Offline','Online','Busy','Away','Snooze','Trade','Play']

    let friends        = $state([])
    let friendsLoading = $state(true)
    let showOffline    = $state(false)

    let inGame  = $derived(friends.filter(f => f.gameid))
    let online  = $derived(friends.filter(f => !f.gameid && f.personastate > 0))
    let offline = $derived(friends.filter(f => !f.gameid && f.personastate === 0))

    let activityFeed = $derived(friends.slice(0, 16))

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

        <!-- Header stat pills -->
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
                        {weekHours}h played this week
                    </div>
                {/if}
            </div>
        </div>

        <!-- Recently Played -->
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
                        {@const img = makeImgState(g.appid)}
                        <div
                            class="recent-card"
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
                            </div>
                            <div class="rc-info">
                                <div class="rc-name">{g.name}</div>
                                <div class="rc-meta">
                                    <span class="rc-week">
                                        <i class="fa-solid fa-fire"></i>
                                        {Math.round((g.playtime_2weeks ?? 0) / 60)}h this week
                                    </span>
                                    <span class="rc-total">
                                        {Math.round(g.playtime_forever / 60)}h total
                                    </span>
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
                    {@const img = makeImgState(g.appid)}
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

        <!-- Playing Now: visual game art cards -->
        {#if inGame.length > 0}
        <div class="panel now-panel">
            <div class="panel-title">
                <i class="fa-solid fa-gamepad"></i>
                Playing Now
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

        <!-- Activity Feed: compact timeline of all friends -->
        <div class="panel activity-feed-panel">
            <div class="panel-title">
                <i class="fa-solid fa-clock-rotate-left"></i>
                Activity Feed
            </div>

            {#if friendsLoading}
                {#each Array(5) as _}
                    <div class="friend-skeleton"></div>
                {/each}
            {:else if activityFeed.length === 0}
                <div class="empty-row">
                    <i class="fa-solid fa-user-group"></i>
                    <span>Friends list may be private</span>
                </div>
            {:else}
                <div class="af-list">
                    {#each activityFeed as f (f.steamid)}
                        {@const statusClass = f.gameid ? 'in-game' : f.personastate > 0 ? 'online' : 'offline'}
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
                                    {:else if f.personastate > 0}
                                        Online
                                    {:else}
                                        {timeAgo(f.lastlogoff)}
                                    {/if}
                                </div>
                            </div>
                            <div class="af-time">{f.gameid || f.personastate > 0 ? 'now' : timeAgo(f.lastlogoff)}</div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="panel friends-panel">
            <div class="panel-title-row">
                <div class="panel-title">
                    <i class="fa-solid fa-user-group"></i>
                    Friends
                </div>
                {#if !friendsLoading}
                    <div class="friend-counts">
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
                {#each Array(6) as _}
                    <div class="friend-skeleton"></div>
                {/each}

            {:else if friends.length === 0}
                <div class="empty-row">
                    <i class="fa-solid fa-user-group"></i>
                    <span>Friends list may be private</span>
                </div>

            {:else}
                <!-- In Game -->
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
                        </div>
                    {/each}
                {/if}

                <!-- Online -->
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

                <!-- Offline (collapsible) -->
                {#if offline.length > 0}
                    <button class="offline-toggle" onclick={() => showOffline = !showOffline}>
                        <i class="fa-solid fa-chevron-{showOffline ? 'up' : 'down'}"></i>
                        {showOffline ? 'Hide' : 'Show'} {offline.length} offline
                    </button>

                    {#if showOffline}
                        {#each offline as f (f.steamid)}
                            <div class="friend offline">
                                <div class="av-wrap">
                                    <img class="av" src={f.avatarmedium} alt="" loading="lazy" />
                                    <div class="dot"></div>
                                </div>
                                <div class="f-info">
                                    <div class="f-name">{f.personaname}</div>
                                    <div class="f-status">
                                        {f.lastlogoff ? timeAgo(f.lastlogoff) : 'Offline'}
                                    </div>
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

    /* ── Layout ──────────────────── */

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

    /* ── Recently Played grid ────── */

    .recent-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .recent-card {
        display: grid;
        grid-template-columns: 9rem 1fr;
        gap: 1rem;
        padding: 0.5rem;
        border-radius: 0.8rem;
        cursor: pointer;
        transition: background 140ms, outline-color 140ms;
        outline: solid 1pt transparent;
    }

    .recent-card:hover {
        background: var(--l1);
        outline-color: var(--accent);
    }

    .rc-art {
        position: relative;
        aspect-ratio: 616 / 353;
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--l2);
        flex-shrink: 0;
    }

    .rc-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .recent-card:hover .rc-art img { transform: scale(1.04); }

    .rc-art-fallback { width: 100%; height: 100%; background: var(--l3); }

    .rc-overlay {
        position: absolute;
        inset: 0;
        background: hsl(0,0%,0%,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 150ms;
    }

    .recent-card:hover .rc-overlay { opacity: 1; }

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
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.45rem;
    }

    .rc-name {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.3;
    }

    .rc-meta {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 0.78rem;
    }

    .rc-week {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--bright-accent);
        font-weight: 600;
    }

    .rc-week i { font-size: 0.7rem; }

    .rc-total { opacity: 0.45; }

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

    .rank {
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.35;
        text-align: center;
    }

    .top-art {
        width: 3.2rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.35rem;
        overflow: hidden;
        background: var(--l2);
        flex-shrink: 0;
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

    .top-hours {
        font-size: 0.78rem;
        font-weight: 700;
        opacity: 0.65;
        white-space: nowrap;
    }

    /* ── Friends panel ───────────── */

    .friends-panel { gap: 0.1rem; }

    .friend-counts { display: flex; gap: 0.4rem; }

    .fc {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 100vh;
        opacity: 0.8;
    }

    .fc.in-game { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .fc.online  { background: hsl(130,40%,14%); color: hsl(130,55%,55%); outline: solid 1pt hsl(130,40%,26%); }

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
        grid-template-columns: auto 1fr;
        gap: 0.65rem;
        padding: 0.45rem 0.55rem;
        border-radius: 0.6rem;
        align-items: center;
        transition: background 120ms;
    }

    .friend:hover { background: var(--l1); }
    .friend.in-game { background: var(--la1); }
    .friend.in-game:hover { background: var(--la2); }
    .friend.offline { opacity: 0.45; }

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

    .f-status {
        font-size: 0.71rem;
        opacity: 0.5;
    }

    .offline-toggle {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.75rem;
        opacity: 0.45;
        cursor: pointer;
        padding: 0.5rem 0.55rem;
        border-radius: 0.5rem;
        color: inherit;
        transition: background 120ms, opacity 120ms;
        margin-top: 0.25rem;
    }

    .offline-toggle:hover { background: var(--l1); opacity: 0.8; }
    .offline-toggle i { font-size: 0.65rem; }

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

    .activity-feed-panel { gap: 0.3rem; }

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
    .af-row.offline { opacity: 0.45; }

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
        opacity: 0.55;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .af-action.playing { color: var(--bright-accent); opacity: 0.9; }
    .af-action i { font-size: 0.6rem; flex-shrink: 0; }

    .af-time {
        font-size: 0.62rem;
        opacity: 0.4;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .in-game .af-time { opacity: 0.7; color: var(--bright-accent); }

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
</style>
