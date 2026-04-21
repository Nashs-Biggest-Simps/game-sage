<script>
    import { onMount } from 'svelte'
    import { db }      from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'
    import { Algorithm }    from '$lib/algorithm'
    import ContinuePlaying  from '$lib/components/Dashboard/ContinuePlaying.svelte'
    import SuggestRow       from '$lib/components/Dashboard/SuggestRow.svelte'
    import QuickStats       from '$lib/components/Dashboard/QuickStats.svelte'
    import ActivityFeed     from '$lib/components/Dashboard/ActivityFeed.svelte'

    const algo = new Algorithm()

    let playSuggestions = $state([])
    let buySuggestions  = $state([])
    let playLoading     = $state(true)
    let buyLoading      = $state(true)
    let news            = $state([])

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])

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

    function newsDate(unix) {
        return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    onMount(() => {
        algo.getPlaySuggestions().then(s => { playSuggestions = s; playLoading = false })
        algo.getBuySuggestions().then(s => { buySuggestions  = s; buyLoading  = false })

        const firstRecent = recentGames[0]
        if (firstRecent?.appid) {
            steamAPI.getNewsForApp(firstRecent.appid, ret => {
                news = ret?.appnews?.newsitems?.slice(0, 3) ?? []
            })
        }
    })
</script>

<div class="dashboard">

    <section class="hero-section">
        <ContinuePlaying />
    </section>

    <div class="main-grid">
        <div class="left-col">

            <!-- Recently Played -->
            {#if recentGames.length > 0}
            <section class="row-section">
                <header class="row-header">
                    <h2 class="row-title">Recently Played</h2>
                </header>
                <div class="scroll-track horizontal-scroll">
                    {#each recentGames as g (g.appid)}
                        {@const img  = makeImgState(g.appid)}
                        {@const hrs  = Math.round(g.playtime_forever / 60)}
                        {@const wkh  = Math.round((g.playtime_2weeks ?? 0) / 60)}
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
                                    <div class="rc-fallback"></div>
                                {/if}
                                {#if wkh > 0}
                                    <div class="rc-badge">
                                        <i class="fa-solid fa-fire"></i>
                                        {wkh}h this week
                                    </div>
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
                                <div class="rc-hours">{hrs > 0 ? `${hrs.toLocaleString()}h total` : 'Never played'}</div>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
            {/if}

            <SuggestRow
                title="Suggested for You"
                type="play"
                items={playSuggestions}
                loading={playLoading}
            />
            <SuggestRow
                title="New Games to Explore"
                type="buy"
                items={buySuggestions}
                loading={buyLoading}
            />

            <!-- Steam News for most recently played game -->
            {#if news.length > 0}
            <section class="row-section">
                <header class="row-header">
                    <h2 class="row-title">
                        What's New
                        {#if recentGames[0]}
                            <span class="news-game-label">for {recentGames[0].name}</span>
                        {/if}
                    </h2>
                </header>
                <div class="news-list">
                    {#each news as item (item.gid)}
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="news-item"
                        >
                            <div class="news-top">
                                <span class="news-source">{item.feedlabel}</span>
                                <span class="news-date">{newsDate(item.date)}</span>
                            </div>
                            <div class="news-title">{item.title}</div>
                        </a>
                    {/each}
                </div>
            </section>
            {/if}

        </div>

        <aside class="right-col">
            <div class="panel">
                <h3 class="panel-title">
                    <i class="fa-solid fa-chart-simple"></i>
                    Your Stats
                </h3>
                <QuickStats />
            </div>

            <div class="panel">
                <h3 class="panel-title">
                    <i class="fa-solid fa-user-group"></i>
                    Friend Activity
                </h3>
                <ActivityFeed />
            </div>
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

    .panel {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
    }

    .panel-title {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin: 0;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.55;
    }

    /* ── Row section ── */

    .row-section {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .row-header {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }

    .row-title {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
    }

    .news-game-label {
        font-size: 0.72rem;
        font-weight: 500;
        opacity: 0.4;
    }

    .scroll-track {
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 2rem;
        padding-left: 1px;
        padding-right: 1px;
        align-items: stretch;
    }

    /* ── Recently Played cards ── */

    .rc-card {
        display: flex;
        flex-direction: column;
        width: 14rem;
        flex-shrink: 0;
        border-radius: 0.9rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        cursor: pointer;
        transition: transform 150ms, outline-color 150ms, box-shadow 150ms;
    }

    .rc-card:hover {
        transform: translateY(-3px);
        outline-color: var(--accent);
        box-shadow: 0 8px 24px hsl(0,0%,0%,0.3);
    }

    .rc-art {
        position: relative;
        width: 100%;
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

    .rc-card:hover .rc-art img { transform: scale(1.04); }
    .rc-fallback { width: 100%; height: 100%; background: var(--l2); }

    .rc-badge {
        position: absolute;
        top: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.18rem 0.5rem;
        background: hsl(0,0%,0%,0.7);
        border-radius: 100vh;
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--bright-accent);
        backdrop-filter: blur(4px);
    }

    .rc-badge i { font-size: 0.55rem; }

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
        padding: 0.65rem 0.85rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .rc-name {
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .rc-hours { font-size: 0.7rem; opacity: 0.45; }

    /* ── News ── */

    .news-list {
        display: flex;
        flex-direction: column;
        background: var(--lb0);
        border-radius: 1rem;
        outline: solid 1pt var(--l3);
        overflow: hidden;
    }

    .news-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.9rem 1.1rem;
        text-decoration: none;
        border-bottom: 1pt solid var(--l2);
        transition: background 140ms;
    }

    .news-item:last-child { border-bottom: none; }
    .news-item:hover { background: var(--l1); }

    .news-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .news-source {
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--bright-accent);
        opacity: 0.8;
    }

    .news-date { font-size: 0.68rem; opacity: 0.4; }

    .news-title {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
