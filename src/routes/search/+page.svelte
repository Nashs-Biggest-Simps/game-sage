<script>
    import { db } from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'

    const GENRE_OPTIONS = [
        'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
        'Sports', 'Racing', 'Puzzle', 'Horror', 'Indie',
        'Casual', 'Shooter', 'Multiplayer', 'Open World', 'Survival',
    ]

    let query        = $state('')
    let mode         = $state('owned')   // 'owned' | 'store'
    let genreFilter  = $state('')
    let storeResults = $state([])
    let storeLoading = $state(false)
    let searched     = $state(false)

    let libraryDetails = $derived($db?.cache?.library?.details ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let ownedAppIds    = $derived($db?.cache?.library?.appIdList ?? [])

    let ownedResults = $derived(() => {
        if (!query.trim()) return []
        const q = query.trim().toLowerCase()
        return ownedAppIds
            .map(id => ({ appid: id, detail: libraryDetails[id]?.data ?? null, playtime: libraryPlaytime[id] ?? 0 }))
            .filter(g => {
                if (!g.detail?.name) return false
                if (!g.detail.name.toLowerCase().includes(q)) return false
                if (genreFilter && !g.detail.genres?.some(gen => gen.description === genreFilter)) return false
                return true
            })
            .slice(0, 60)
    })

    async function runSearch() {
        if (!query.trim()) return
        searched = true
        if (mode === 'store') {
            storeLoading = true
            storeResults = []
            steamAPI.searchStore(query.trim(), (res) => {
                storeResults = res?.items ?? []
                storeLoading = false
            })
        }
    }

    function onKeydown(e) {
        if (e.key === 'Enter') runSearch()
    }

    function formatPrice(item) {
        if (!item.price) return 'Free'
        if (item.price.final === 0) return 'Free'
        return `$${(item.price.final / 100).toFixed(2)}`
    }

    function discount(item) {
        return item.price?.discount_percent > 0 ? item.price.discount_percent : null
    }

    function hoursLabel(minutes) {
        const h = Math.round(minutes / 60)
        if (h === 0) return 'Unplayed'
        if (h >= 1000) return `${(h / 1000).toFixed(1)}k h`
        return `${h.toLocaleString()}h`
    }

    let activeResults = $derived(mode === 'owned' ? ownedResults() : storeResults)
    let isEmpty = $derived(searched && !storeLoading && activeResults.length === 0)
</script>

<div class="page">

    <!-- ── Search bar ── -->
    <div class="search-hero">
        <h1 class="page-title">Search</h1>
        <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                class="search-input"
                type="text"
                placeholder="Search for a game…"
                bind:value={query}
                onkeydown={onKeydown}
                autofocus
            />
            {#if query}
                <button class="clear-btn" onclick={() => { query = ''; searched = false; storeResults = [] }} aria-label="Clear">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            {/if}
            <button class="search-btn" onclick={runSearch}>Search</button>
        </div>
    </div>

    <!-- ── Filter bar ── -->
    <div class="filter-bar">
        <div class="mode-tabs">
            <button class="mode-tab {mode === 'owned' ? 'active' : ''}" onclick={() => { mode = 'owned'; searched = !!query.trim() }}>
                <i class="fa-solid fa-gamepad"></i>
                My Library
            </button>
            <button class="mode-tab {mode === 'store' ? 'active' : ''}" onclick={() => { mode = 'store'; if (query.trim()) runSearch() }}>
                <i class="fa-brands fa-steam"></i>
                Steam Store
            </button>
        </div>

        {#if mode === 'owned'}
            <div class="genre-filter">
                <label class="select-wrap">
                    <span class="select-label">Genre</span>
                    <span class="select-value" aria-hidden="true">{genreFilter || 'All'}</span>
                    <select value={genreFilter} onchange={(e) => { genreFilter = e.target.value }}>
                        <option value="">All</option>
                        {#each GENRE_OPTIONS as g}
                            <option value={g}>{g}</option>
                        {/each}
                    </select>
                    <i class="fa-solid fa-chevron-down select-arrow"></i>
                </label>
            </div>
        {/if}

        {#if (mode === 'owned' && searched) || (mode === 'store' && searched)}
            <div class="result-count">
                {#if storeLoading}
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Searching…
                {:else}
                    {activeResults.length} result{activeResults.length !== 1 ? 's' : ''}
                {/if}
            </div>
        {/if}
    </div>

    <!-- ── Results ── -->
    {#if !searched && !query.trim()}
        <div class="start-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Type a game name and press Enter or Search</span>
        </div>

    {:else if storeLoading}
        <div class="start-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Searching Steam Store…</span>
        </div>

    {:else if isEmpty}
        <div class="start-state">
            <i class="fa-solid fa-face-frown"></i>
            <span>No results for "{query}"</span>
        </div>

    {:else if mode === 'owned'}
        <div class="grid">
            {#each ownedResults() as g (g.appid)}
                {@const detail = g.detail}
                {@const hours  = hoursLabel(g.playtime)}
                <button
                    class="card owned-card"
                    onclick={() => goto(resolve(`/view?id=${g.appid}`))}
                >
                    <div class="card-art">
                        {#if detail?.header_image}
                            <img src={detail.header_image} alt={detail.name} loading="lazy" />
                        {:else}
                            <div class="art-fallback"></div>
                        {/if}
                        <div class="art-badge">{hours}</div>
                    </div>
                    <div class="card-info">
                        <div class="card-name">{detail?.name ?? `App ${g.appid}`}</div>
                        {#if detail?.genres?.length}
                            <div class="card-tags">
                                {#each detail.genres.slice(0, 2) as gen}
                                    <span class="tag">{gen.description}</span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </button>
            {/each}
        </div>

    {:else}
        <div class="grid">
            {#each storeResults as item (item.id)}
                {@const price = formatPrice(item)}
                {@const disc  = discount(item)}
                <button
                    class="card store-card"
                    onclick={() => goto(resolve(`/view?id=${item.id}`))}
                >
                    <div class="card-art">
                        {#if item.logo}
                            <img src={item.logo} alt={item.name} loading="lazy" />
                        {:else}
                            <div class="art-fallback"></div>
                        {/if}
                        <div class="art-badge store-price">
                            {#if disc}
                                <span class="disc-pct">-{disc}%</span>
                            {/if}
                            {price}
                        </div>
                    </div>
                    <div class="card-info">
                        <div class="card-name">{item.name}</div>
                        {#if ownedAppIds.includes(item.id)}
                            <span class="owned-pill"><i class="fa-solid fa-check"></i> Owned</span>
                        {/if}
                    </div>
                </button>
            {/each}
        </div>
    {/if}

</div>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
    }

    /* ── Search hero ──────────────── */

    .search-hero {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .page-title {
        font-size: 1.9rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.02em;
    }

    .search-bar {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 1rem;
        background: var(--l1);
        border-radius: 0.9rem;
        outline: solid 1pt var(--l3);
        transition: outline-color 150ms;
    }

    .search-bar:focus-within { outline-color: var(--accent); }

    .search-icon { opacity: 0.4; font-size: 0.9rem; flex-shrink: 0; }

    .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 1rem;
        font-weight: 500;
        color: inherit;
        font-family: inherit;
        min-width: 0;
    }

    .search-input::placeholder { opacity: 0.35; }

    .clear-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: var(--l3);
        font-size: 0.65rem;
        opacity: 0.6;
        cursor: pointer;
        transition: opacity 120ms;
        flex-shrink: 0;
    }

    .clear-btn:hover { opacity: 1; }

    .search-btn {
        padding: 0.5rem 1.1rem;
        background: var(--accent);
        border-radius: 0.6rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: background 120ms;
        flex-shrink: 0;
    }

    .search-btn:hover { background: var(--bright-accent); }

    /* ── Filter bar ───────────────── */

    .filter-bar {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
    }

    .mode-tabs {
        display: flex;
        gap: 0.2rem;
        background: var(--l1);
        border-radius: 0.65rem;
        padding: 0.25rem;
        outline: solid 1pt var(--l2);
    }

    .mode-tab {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.38rem 0.85rem;
        border-radius: 0.45rem;
        font-size: 0.83rem;
        font-weight: 600;
        cursor: pointer;
        opacity: 0.55;
        transition: background 120ms, opacity 120ms, color 120ms;
        color: inherit;
    }

    .mode-tab i { font-size: 0.78rem; }
    .mode-tab:hover { opacity: 0.85; }

    .mode-tab.active {
        background: var(--la1);
        color: var(--bright-accent);
        opacity: 1;
        outline: solid 1pt var(--la3);
    }

    /* ── Genre dropdown ───────────── */

    .genre-filter { display: flex; }

    .select-wrap {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 0.7rem 0.45rem 0.85rem;
        background: var(--l1);
        border-radius: 0.65rem;
        outline: solid 1pt var(--l3);
        cursor: pointer;
        transition: outline-color 120ms;
    }

    .select-wrap:focus-within { outline-color: var(--accent); }

    .select-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.45;
        white-space: nowrap;
        pointer-events: none;
    }

    .select-value {
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .select-wrap select {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        font-family: inherit;
    }

    .select-arrow {
        font-size: 0.6rem;
        opacity: 0.45;
        pointer-events: none;
        flex-shrink: 0;
    }

    /* ── Result count ─────────────── */

    .result-count {
        margin-left: auto;
        font-size: 0.78rem;
        opacity: 0.45;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    /* ── Empty / start states ─────── */

    .start-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        height: 14rem;
        background: var(--l1);
        border-radius: 1.2rem;
        font-size: 0.88rem;
        opacity: 0.4;
    }

    .start-state i { font-size: 1.5rem; }

    /* ── Results grid ─────────────── */

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 0.8rem;
        padding-bottom: 2rem;
    }

    .card {
        display: flex;
        flex-direction: column;
        background: var(--l1);
        border-radius: 0.9rem;
        overflow: hidden;
        outline: solid 1pt var(--l2);
        cursor: pointer;
        text-align: left;
        transition: transform 180ms, outline-color 180ms, box-shadow 180ms;
    }

    .card:hover {
        transform: translateY(-3px);
        outline-color: var(--accent);
        box-shadow: 0 8px 28px hsl(0, 0%, 0%, 0.35);
    }

    .card-art {
        position: relative;
        aspect-ratio: 616 / 353;
        background: var(--l2);
        overflow: hidden;
    }

    .card-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .card:hover .card-art img { transform: scale(1.05); }

    .art-fallback { width: 100%; height: 100%; background: var(--l2); }

    .art-badge {
        position: absolute;
        bottom: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.22rem 0.55rem;
        background: hsl(0, 0%, 0%, 0.72);
        backdrop-filter: blur(6px);
        border-radius: 100vh;
        font-size: 0.75rem;
        font-weight: 700;
        color: white;
    }

    .store-price { gap: 0.4rem; }

    .disc-pct {
        color: hsl(120, 60%, 65%);
        font-size: 0.7rem;
    }

    .card-info {
        padding: 0.75rem 0.85rem 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .card-name {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }

    .tag {
        font-size: 0.72rem;
        font-weight: 500;
        padding: 0.2rem 0.55rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.8;
    }

    .owned-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--bright-accent);
        background: var(--la1);
        border-radius: 100vh;
        padding: 0.2rem 0.55rem;
        outline: solid 1pt var(--la3);
        width: fit-content;
    }

    .owned-pill i { font-size: 0.6rem; }
</style>
