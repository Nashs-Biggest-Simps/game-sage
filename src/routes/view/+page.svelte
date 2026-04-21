<script>
    import { page }    from '$app/state'
    import { onMount } from 'svelte'
    import { db }      from '$lib/data'
    import { steamAPI } from '$lib/steam'

    let appid = $derived(page.url.searchParams.get('id'))

    let cachedGame  = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
    let fetchedGame = $state(null)
    let game        = $derived(cachedGame ?? fetchedGame)
    let loadingGame = $state(true)

    let hltb         = $state(null)
    let news         = $state([])
    let achievements = $state(null)
    let globalPcts   = $state(null)
    let loadingAch   = $state(true)

    let myPlaytime = $derived($db?.cache?.library?.playtime?.[appid] ?? 0)
    let myHours    = $derived(Math.round(myPlaytime / 60))
    let isOwned    = $derived(appid in ($db?.cache?.library?.playtime ?? {}))

    let screenshots = $derived(game?.screenshots?.slice(0, 8) ?? [])
    let price       = $derived(game?.price_overview?.final_formatted ?? (game?.is_free ? 'Free' : null))
    let discount    = $derived(game?.price_overview?.discount_percent ?? 0)
    let origPrice   = $derived(game?.price_overview?.initial_formatted ?? null)
    let storeUrl    = $derived(`https://store.steampowered.com/app/${appid}`)
    let genres      = $derived(game?.genres?.map(g => g.description) ?? [])
    let categories  = $derived(game?.categories?.slice(0, 6)?.map(c => c.description) ?? [])

    // Hero image fallback chain
    let heroIdx    = $state(0)
    const HERO_IMGS = (id) => [
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/library_hero.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
    ]
    let heroSrc    = $derived(HERO_IMGS(appid ?? '0')[heroIdx] ?? null)
    let heroFailed = $derived(heroIdx >= HERO_IMGS(appid ?? '0').length)
    $effect(() => { appid; heroIdx = 0 })

    let heroLoaded = $state(false)
    $effect(() => {
        if (!heroSrc || heroFailed) { heroLoaded = false; return }
        heroLoaded = false
        const img = new Image()
        img.onload  = () => { heroLoaded = true }
        img.onerror = () => { heroIdx++; heroLoaded = false }
        img.src = heroSrc
    })

    let totalAch  = $derived(achievements?.achievements?.length ?? 0)
    let earnedAch = $derived(achievements?.achievements?.filter(a => a.achieved)?.length ?? 0)
    let achPct    = $derived(totalAch > 0 ? Math.round((earnedAch / totalAch) * 100) : 0)

    let rarestAch = $derived(() => {
        if (!achievements?.achievements?.length) return []
        const pctMap = {}
        ;(globalPcts?.achievementpercentages?.achievements ?? []).forEach(a => { pctMap[a.name] = a.percent })
        return achievements.achievements
            .filter(a => a.achieved)
            .map(a => ({ ...a, globalPct: pctMap[a.apiname] ?? null }))
            .sort((a, b) => (a.globalPct ?? 100) - (b.globalPct ?? 100))
            .slice(0, 6)
    })

    onMount(() => {
        const id = page.url.searchParams.get('id')
        if (!id) return

        if (!cachedGame) {
            steamAPI.getGameDetails(id, ret => {
                fetchedGame = ret?.[id]?.data ?? null
                loadingGame = false
            })
        } else {
            loadingGame = false
        }

        steamAPI.howLongToBeat(id, ret => { hltb = ret ?? null })
        steamAPI.getNewsForApp(id, ret => { news = ret?.appnews?.newsitems?.slice(0, 4) ?? [] })
        steamAPI.getPlayerAchievements(id, ret => {
            achievements = ret?.playerstats ?? null
            loadingAch = false
        })
        steamAPI.getGlobalAchievementPercentages(id, ret => { globalPcts = ret ?? null })
    })

    function hltbFmt(val) {
        if (!val) return null
        const h = Math.trunc(val)
        const m = Math.round((val % 1) * 60)
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }

    function newsDate(unix) {
        return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    function stripHtml(html) {
        return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)
    }
</script>

<div class="view-page">

    <!-- Top bar -->
    <div class="topbar">
        <button class="back-btn" onclick={() => history.back()} aria-label="Go back">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        {#if game}
            <span class="topbar-name">{game.name}</span>
        {:else if loadingGame}
            <div class="topbar-sk"></div>
        {/if}
    </div>

    {#if loadingGame && !game}
        <div class="sk-hero"></div>
        <div class="content-grid">
            <div class="main-col sk-col">
                <div class="sk-panel"></div>
                <div class="sk-panel"></div>
            </div>
            <div class="info-col sk-col">
                <div class="sk-panel sm"></div>
                <div class="sk-panel sm"></div>
                <div class="sk-panel sm"></div>
            </div>
        </div>

    {:else if game}

        <!-- Hero -->
        <div
            class="hero"
            style={heroLoaded ? `background-image: url('${heroSrc}')` : ''}
        >
            <div class="hero-gradient"></div>
            <div class="hero-content">
                {#if genres.length > 0}
                    <div class="hero-chips">
                        {#each genres.slice(0, 3) as g}
                            <span class="genre-chip">{g}</span>
                        {/each}
                    </div>
                {/if}
                <h1 class="hero-title">{game.name}</h1>
                <div class="hero-meta">
                    {#if game.developers?.length}
                        <span>{game.developers[0]}</span>
                    {/if}
                    {#if game.release_date?.date}
                        <span class="dot-sep">·</span>
                        <span>{game.release_date.date}</span>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Two-column content -->
        <div class="content-grid">

            <!-- ── Main column ───────────────────────────── -->
            <div class="main-col">

                <!-- About -->
                {#if game.short_description}
                    <section class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-align-left"></i>About
                        </div>
                        <p class="description">{game.short_description}</p>
                    </section>
                {/if}

                <!-- Screenshots -->
                {#if screenshots.length > 0}
                    <section class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-images"></i>Screenshots
                        </div>
                        <div class="screenshots-scroll horizontal-scroll">
                            {#each screenshots as s (s.id)}
                                <a
                                    href={s.path_full}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="ss-link"
                                >
                                    <img src={s.path_thumbnail} alt="" loading="lazy" class="ss-img" />
                                </a>
                            {/each}
                        </div>
                    </section>
                {/if}

                <!-- Achievements -->
                {#if !loadingAch}
                    {#if achievements?.success && totalAch > 0}
                        <section class="panel">
                            <div class="ach-top">
                                <div class="panel-label">
                                    <i class="fa-solid fa-medal"></i>Achievements
                                </div>
                                <div class="ach-fraction">
                                    <span class="ach-earned">{earnedAch}</span>
                                    <span class="ach-total">/ {totalAch}</span>
                                </div>
                            </div>
                            <div class="ach-bar-track">
                                <div class="ach-bar-fill" style="width:{achPct}%"></div>
                            </div>
                            <div class="ach-pct">{achPct}% complete</div>

                            {#if rarestAch().length > 0}
                                <div class="ach-sublabel">
                                    <i class="fa-solid fa-star"></i>
                                    Rarest Earned
                                </div>
                                <div class="ach-grid">
                                    {#each rarestAch() as a (a.apiname)}
                                        <div class="ach-item" title="{a.name}: {a.description ?? ''}">
                                            {#if a.icon}
                                                <img src={a.icon} alt={a.name} class="ach-icon" loading="lazy" />
                                            {:else}
                                                <div class="ach-icon-ph">
                                                    <i class="fa-solid fa-trophy"></i>
                                                </div>
                                            {/if}
                                            <div class="ach-info">
                                                <div class="ach-name">{a.name}</div>
                                                {#if a.globalPct !== null}
                                                    <div class="ach-rarity">{a.globalPct.toFixed(1)}% of players</div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </section>
                    {/if}
                {/if}

                <!-- News -->
                {#if news.length > 0}
                    <section class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-newspaper"></i>Latest News
                        </div>
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
                                    {#if item.contents}
                                        <div class="news-snippet">{stripHtml(item.contents)}…</div>
                                    {/if}
                                </a>
                            {/each}
                        </div>
                    </section>
                {/if}

            </div>

            <!-- ── Info sidebar ──────────────────────────── -->
            <aside class="info-col">

                <!-- Actions -->
                <div class="panel action-panel">
                    {#if isOwned}
                        <button
                            class="btn-play"
                            onclick={() => { window.location.href = `steam://run/${appid}` }}
                        >
                            <i class="fa-solid fa-play"></i>
                            Play in Steam
                        </button>
                    {/if}
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" class="btn-store">
                        <i class="fa-brands fa-steam"></i>
                        {#if discount > 0}
                            <span class="discount-badge">-{discount}%</span>
                        {/if}
                        {price ?? 'View on Steam'}
                    </a>
                    {#if discount > 0 && origPrice}
                        <div class="orig-price">Was {origPrice}</div>
                    {/if}
                </div>

                <!-- Personal playtime -->
                {#if isOwned}
                    <div class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-clock"></i>Your Playtime
                        </div>
                        <div class="playtime-big">
                            {myHours > 0 ? `${myHours.toLocaleString()}h` : 'Never played'}
                        </div>
                        {#if myHours > 0}
                            <div class="playtime-sub">hours in your library</div>
                        {/if}
                    </div>
                {/if}

                <!-- HLTB -->
                {#if hltb?.mainStory || hltb?.mainStoryWithExtras || hltb?.completionist}
                    <div class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-hourglass-half"></i>How Long to Beat
                        </div>
                        <div class="hltb-list">
                            {#if hltb.mainStory}
                                <div class="hltb-row">
                                    <span class="hltb-key">Main Story</span>
                                    <span class="hltb-val">{hltbFmt(hltb.mainStory)}</span>
                                </div>
                            {/if}
                            {#if hltb.mainStoryWithExtras}
                                <div class="hltb-row">
                                    <span class="hltb-key">Main + Extras</span>
                                    <span class="hltb-val">{hltbFmt(hltb.mainStoryWithExtras)}</span>
                                </div>
                            {/if}
                            {#if hltb.completionist}
                                <div class="hltb-row">
                                    <span class="hltb-key">Completionist</span>
                                    <span class="hltb-val">{hltbFmt(hltb.completionist)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Game details -->
                <div class="panel">
                    <div class="panel-label">
                        <i class="fa-solid fa-circle-info"></i>Game Details
                    </div>
                    <div class="detail-rows">
                        {#if game.developers?.length}
                            <div class="detail-row">
                                <span class="detail-key">Developer</span>
                                <span class="detail-val">{game.developers.join(', ')}</span>
                            </div>
                        {/if}
                        {#if game.publishers?.length}
                            <div class="detail-row">
                                <span class="detail-key">Publisher</span>
                                <span class="detail-val">{game.publishers.join(', ')}</span>
                            </div>
                        {/if}
                        {#if game.release_date?.date}
                            <div class="detail-row">
                                <span class="detail-key">Released</span>
                                <span class="detail-val">{game.release_date.date}</span>
                            </div>
                        {/if}
                        {#if game.platforms}
                            <div class="detail-row">
                                <span class="detail-key">Platforms</span>
                                <span class="detail-val">
                                    {Object.entries(game.platforms).filter(([, v]) => v).map(([k]) => k[0].toUpperCase() + k.slice(1)).join(', ')}
                                </span>
                            </div>
                        {/if}
                        {#if totalAch > 0}
                            <div class="detail-row">
                                <span class="detail-key">Achievements</span>
                                <span class="detail-val">{totalAch} total</span>
                            </div>
                        {/if}
                    </div>

                    {#if genres.length > 0}
                        <div class="chip-row">
                            {#each genres as g}
                                <span class="chip">{g}</span>
                            {/each}
                        </div>
                    {/if}
                    {#if categories.length > 0}
                        <div class="chip-row">
                            {#each categories as c}
                                <span class="chip dim">{c}</span>
                            {/each}
                        </div>
                    {/if}
                </div>

            </aside>
        </div>

    {:else}
        <div class="not-found">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Could not load game data</span>
        </div>
    {/if}

</div>

<style>
    .view-page {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    /* ── Topbar ──────────────────────────── */

    .topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .back-btn {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 120ms, outline-color 120ms;
    }

    .back-btn:hover { background: var(--l2); outline-color: var(--l4); }

    .topbar-name {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .topbar-sk {
        height: 1.5rem;
        width: 14rem;
        border-radius: 0.4rem;
        background: var(--l2);
        animation: shimmer 1.6s ease-in-out infinite;
        background: linear-gradient(90deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 100%;
    }

    /* ── Hero ────────────────────────────── */

    .hero {
        position: relative;
        height: 22rem;
        border-radius: 1.2rem;
        overflow: hidden;
        background: var(--l1);
        background-size: cover;
        background-position: center top;
        outline: solid 1pt var(--l3);
    }

    .hero-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to right,
            hsl(0,0%,0%,0.9) 0%,
            hsl(0,0%,0%,0.65) 40%,
            hsl(0,0%,0%,0.1) 100%
        ), linear-gradient(
            to top,
            hsl(0,0%,0%,0.7) 0%,
            transparent 60%
        );
    }

    .hero-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 2rem 2.4rem;
        gap: 0.5rem;
    }

    .hero-chips {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .genre-chip {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        padding: 0.2rem 0.6rem;
        background: hsl(0,0%,100%,0.15);
        border-radius: 100vh;
        backdrop-filter: blur(4px);
        color: white;
    }

    .hero-title {
        font-size: 2.8rem;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.02em;
        text-shadow: 0 2px 12px hsl(0,0%,0%,0.6);
        max-width: 80%;
        margin: 0;
        color: white;
    }

    .hero-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        opacity: 0.7;
        color: white;
    }

    .dot-sep { opacity: 0.5; }

    /* ── Content grid ────────────────────── */

    .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: 1.4rem;
        align-items: start;
    }

    .main-col { display: flex; flex-direction: column; gap: 1.2rem; }
    .info-col  { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 2.4rem; }

    /* ── Panels ──────────────────────────── */

    .panel {
        background: var(--lb0);
        border-radius: 1.1rem;
        outline: solid 1pt var(--l3);
        padding: 1.3rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .panel-label {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.5;
    }

    /* ── Description ─────────────────────── */

    .description {
        font-size: 0.9rem;
        line-height: 1.65;
        opacity: 0.82;
        margin: 0;
    }

    /* ── Screenshots ─────────────────────── */

    .screenshots-scroll {
        gap: 0.6rem;
        padding-top: 4pt;
        padding-bottom: 0.5rem;
        padding-left: 1px;
        padding-right: 1px;
    }

    .ss-link {
        flex-shrink: 0;
        border-radius: 0.5rem;
        overflow: hidden;
        display: block;
        outline: solid 1pt transparent;
        transition: outline-color 140ms, transform 140ms;
    }

    .ss-link:hover {
        outline-color: var(--accent);
        transform: translateY(-2px);
    }

    .ss-img {
        height: 8rem;
        width: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        display: block;
    }

    /* ── Achievements ────────────────────── */

    .ach-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ach-fraction { display: flex; align-items: baseline; gap: 0.2rem; }
    .ach-earned { font-size: 1.4rem; font-weight: 800; color: var(--bright-accent); }
    .ach-total  { font-size: 0.8rem; opacity: 0.5; }

    .ach-bar-track {
        height: 0.4rem;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .ach-bar-fill {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .ach-pct { font-size: 0.73rem; opacity: 0.5; margin-top: -0.3rem; }

    .ach-sublabel {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.4;
        padding-top: 0.3rem;
        border-top: 1pt solid var(--l2);
    }

    .ach-grid {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .ach-item {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.4rem 0.5rem;
        border-radius: 0.6rem;
        transition: background 120ms;
        cursor: default;
    }

    .ach-item:hover { background: var(--l1); }

    .ach-icon {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.3rem;
        flex-shrink: 0;
        object-fit: cover;
    }

    .ach-icon-ph {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.3rem;
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        opacity: 0.4;
        flex-shrink: 0;
    }

    .ach-info { min-width: 0; }

    .ach-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ach-rarity { font-size: 0.68rem; color: var(--bright-accent); opacity: 0.85; }

    /* ── News ────────────────────────────── */

    .news-list { display: flex; flex-direction: column; gap: 0.3rem; }

    .news-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.8rem 0.9rem;
        border-radius: 0.8rem;
        outline: solid 1pt transparent;
        transition: background 140ms, outline-color 140ms;
        text-decoration: none;
    }

    .news-item:hover {
        background: var(--l1);
        outline-color: var(--l3);
    }

    .news-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .news-source {
        font-size: 0.63rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--bright-accent);
        opacity: 0.8;
    }

    .news-date { font-size: 0.68rem; opacity: 0.4; white-space: nowrap; }

    .news-title {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.35;
    }

    .news-snippet {
        font-size: 0.75rem;
        opacity: 0.5;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* ── Action panel ────────────────────── */

    .action-panel { gap: 0.65rem; }

    .btn-play {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: 0.75rem;
        background: var(--accent);
        border-radius: 0.75rem;
        font-size: 0.95rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: background 150ms, transform 100ms;
        width: 100%;
    }

    .btn-play:hover { background: var(--bright-accent); transform: scale(1.01); }

    .btn-store {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.65rem;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        border-radius: 0.75rem;
        font-size: 0.88rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: background 150ms, outline-color 150ms;
    }

    .btn-store:hover { background: var(--l2); outline-color: var(--l4); }

    .discount-badge {
        background: hsl(130,60%,25%);
        color: hsl(130,65%,55%);
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 0.3rem;
    }

    .orig-price { font-size: 0.72rem; opacity: 0.4; text-align: center; text-decoration: line-through; }

    /* ── Playtime panel ──────────────────── */

    .playtime-big {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--bright-accent);
        line-height: 1;
    }

    .playtime-sub { font-size: 0.72rem; opacity: 0.45; margin-top: -0.3rem; }

    /* ── HLTB panel ──────────────────────── */

    .hltb-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .hltb-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.45rem 0.4rem;
        border-radius: 0.5rem;
        transition: background 120ms;
    }

    .hltb-row:hover { background: var(--l1); }
    .hltb-key { font-size: 0.82rem; opacity: 0.65; }
    .hltb-val { font-size: 0.82rem; font-weight: 700; }

    /* ── Game detail rows ────────────────── */

    .detail-rows { display: flex; flex-direction: column; gap: 0.1rem; }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 0.8rem;
        padding: 0.35rem 0.4rem;
        border-radius: 0.4rem;
        transition: background 120ms;
    }

    .detail-row:hover { background: var(--l1); }
    .detail-key { font-size: 0.78rem; opacity: 0.5; white-space: nowrap; flex-shrink: 0; }
    .detail-val { font-size: 0.78rem; font-weight: 500; text-align: right; }

    .chip-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }

    .chip {
        font-size: 0.68rem;
        padding: 0.22rem 0.6rem;
        background: var(--la1);
        color: var(--bright-accent);
        outline: solid 1pt var(--la3);
        border-radius: 100vh;
        font-weight: 600;
    }

    .chip.dim {
        background: var(--l1);
        color: inherit;
        outline-color: var(--l3);
        opacity: 0.65;
    }

    /* ── Loading skeletons ───────────────── */

    .sk-hero {
        height: 22rem;
        border-radius: 1.2rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-col { display: flex; flex-direction: column; gap: 1.2rem; }

    .sk-panel {
        height: 8rem;
        border-radius: 1.1rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-panel.sm { height: 5rem; }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* ── Not found ───────────────────────── */

    .not-found {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 4rem;
        font-size: 0.9rem;
        opacity: 0.4;
    }

    .not-found i { font-size: 1.5rem; }
</style>
