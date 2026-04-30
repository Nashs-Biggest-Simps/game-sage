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
    <div class="search-header">
        <div>
            <div class="page-title">Search</div>
            <div class="page-subtitle">Find games in your library or discover titles across the Steam Store.</div>
        </div>
        <div class="search-stats">
            <span><i class="fa-solid fa-gamepad"></i>{ownedAppIds.length.toLocaleString()} owned</span>
            <span><i class="fa-brands fa-steam"></i>Store lookup</span>
        </div>
    </div>

    <div class="search-hero">
        <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                class="search-input"
                type="text"
                placeholder="Search for a game…"
                bind:value={query}
                onkeydown={onKeydown}
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
                        <img
                            src="https://cdn.akamai.steamstatic.com/steam/apps/{item.id}/header.jpg"
                            alt={item.name}
                            loading="lazy"
                            onerror={(e) => {
                                const el = e.currentTarget
                                if (item.tiny_image && el.src !== item.tiny_image) {
                                    el.src = item.tiny_image
                                    el.dataset.fallback = '1'
                                } else {
                                    el.style.display = 'none'
                                }
                            }}
                        />
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
        gap: 1.15rem;
    }

    .search-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
    }

    .page-subtitle {
        margin-top: 0.28rem;
        color: hsl(212, 18%, 84%, 0.5);
        font-size: 0.88rem;
    }

    .search-stats {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        flex-wrap: wrap;
        justify-content: flex-end;
        flex-shrink: 0;
    }

    .search-stats span {
        display: inline-flex;
        align-items: center;
        gap: 0.38rem;
        padding: 0.42rem 0.7rem;
        border-radius: 100vh;
        background: hsl(212, 24%, 12%, 0.42);
        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
        color: hsl(212, 18%, 84%, 0.62);
        font-size: 0.74rem;
        font-weight: 800;
        backdrop-filter: blur(18px) saturate(1.18);
        -webkit-backdrop-filter: blur(18px) saturate(1.18);
    }

    .search-stats i {
        color: var(--bright-accent);
        font-size: 0.7rem;
    }

    .search-hero {
        display: block;
    }

    .search-bar {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.82rem 1rem;
        background: hsl(212, 24%, 8%, 0.45);
        border-radius: 0.9rem;
        transition: outline-color 150ms, background 150ms, box-shadow 150ms;
        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.04);
    }

    .search-bar:focus-within {
        background: hsl(212, 24%, 9%, 0.58);
        box-shadow: 0 0 0 3px hsl(188, 80%, 56%, 0.08), inset 0 1px 0 hsl(0, 0%, 100%, 0.05);
    }

    .search-icon {
        color: var(--bright-accent);
        opacity: 0.72;
        font-size: 0.9rem;
        flex-shrink: 0;
    }

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

    .search-input::placeholder { color: hsl(212, 18%, 84%, 0.38); opacity: 1; }

    .clear-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: hsl(212, 24%, 24%, 0.72);
        font-size: 0.65rem;
        opacity: 0.6;
        cursor: pointer;
        transition: opacity 120ms, background 120ms;
        flex-shrink: 0;
    }

    .clear-btn:hover {
        opacity: 1;
        background: hsl(212, 24%, 30%, 0.86);
    }

    .search-btn {
        padding: 0.56rem 1.15rem;
        background: linear-gradient(135deg, var(--accent), hsl(188, 82%, 48%));
        border-radius: 0.6rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: transform 120ms, filter 120ms, box-shadow 120ms;
        flex-shrink: 0;
        box-shadow: 0 10px 24px hsl(188, 80%, 26%, 0.24);
    }

    .search-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.12);
        box-shadow: 0 14px 32px hsl(188, 80%, 26%, 0.34);
    }

    /* ── Filter bar ───────────────── */

    .filter-bar {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
        padding: 0.25rem 0.1rem;
    }

    .mode-tabs {
        display: flex;
        gap: 0.2rem;
        background: hsl(212, 24%, 12%, 0.5);
        border-radius: 0.65rem;
        padding: 0.25rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.44);
        backdrop-filter: blur(20px) saturate(1.18);
        -webkit-backdrop-filter: blur(20px) saturate(1.18);
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
    .mode-tab:hover {
        opacity: 0.9;
        background: hsl(212, 24%, 22%, 0.5);
    }

    .mode-tab.active {
        background: hsl(188, 76%, 34%, 0.22);
        color: var(--bright-accent);
        opacity: 1;
        outline: solid 1pt hsl(188, 72%, 48%, 0.36);
    }

    /* ── Genre dropdown ───────────── */

    .genre-filter { display: flex; }

    .select-wrap {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 0.7rem 0.45rem 0.85rem;
        background: hsl(212, 24%, 12%, 0.5);
        border-radius: 0.65rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.44);
        cursor: pointer;
        transition: outline-color 120ms, background 120ms;
        backdrop-filter: blur(20px) saturate(1.18);
        -webkit-backdrop-filter: blur(20px) saturate(1.18);
    }

    .select-wrap:hover,
    .select-wrap:focus-within {
        background: hsl(212, 24%, 16%, 0.58);
        outline-color: hsl(188, 80%, 56%, 0.58);
    }

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
        color: hsl(212, 18%, 84%, 0.52);
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
        background:
            radial-gradient(circle at 50% 0%, hsl(188, 72%, 38%, 0.12), transparent 16rem),
            hsl(212, 24%, 12%, 0.5);
        border-radius: 1.2rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
        font-size: 0.88rem;
        color: hsl(212, 18%, 84%, 0.55);
        backdrop-filter: blur(24px) saturate(1.2);
        -webkit-backdrop-filter: blur(24px) saturate(1.2);
    }

    .start-state i {
        color: var(--bright-accent);
        font-size: 1.5rem;
        opacity: 0.85;
    }

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
        background:
            linear-gradient(180deg, hsl(212, 24%, 15%, 0.68), hsl(212, 24%, 10%, 0.52));
        border-radius: 0.9rem;
        overflow: hidden;
        outline: solid 1pt hsl(212, 38%, 36%, 0.45);
        cursor: pointer;
        text-align: left;
        transition: transform 180ms, outline-color 180ms, box-shadow 180ms, background 180ms;
        box-shadow:
            0 14px 38px hsl(0, 0%, 0%, 0.16),
            inset 0 1px 0 hsl(0, 0%, 100%, 0.04);
        backdrop-filter: blur(20px) saturate(1.18);
        -webkit-backdrop-filter: blur(20px) saturate(1.18);
    }

    .card:hover {
        transform: translateY(-3px);
        outline-color: hsl(188, 76%, 52%, 0.55);
        background:
            linear-gradient(180deg, hsl(212, 24%, 18%, 0.76), hsl(212, 24%, 12%, 0.62));
        box-shadow: 0 18px 46px hsl(0, 0%, 0%, 0.3);
    }

    .card-art {
        position: relative;
        aspect-ratio: 616 / 353;
        background: hsl(212, 24%, 18%, 0.8);
        overflow: hidden;
    }

    .card-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        transition: transform 200ms;
    }

    :global(.card-art img[data-fallback]) {
        object-fit: contain;
        background: hsl(212, 24%, 14%, 0.86);
    }

    .card:hover .card-art img { transform: scale(1.05); }

    .art-fallback {
        width: 100%;
        height: 100%;
        background:
            radial-gradient(circle at 35% 20%, hsl(188, 76%, 42%, 0.2), transparent 8rem),
            hsl(212, 24%, 14%, 0.86);
    }

    .art-badge {
        position: absolute;
        bottom: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.22rem 0.55rem;
        background: hsl(212, 28%, 7%, 0.74);
        backdrop-filter: blur(10px) saturate(1.25);
        -webkit-backdrop-filter: blur(10px) saturate(1.25);
        border-radius: 100vh;
        outline: solid 1pt hsl(0, 0%, 100%, 0.08);
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
        background: hsl(212, 24%, 20%, 0.56);
        border-radius: 100vh;
        opacity: 0.8;
        outline: solid 1pt hsl(212, 38%, 38%, 0.34);
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

    @media (max-width: 720px) {
        .search-header {
            align-items: flex-start;
            flex-direction: column;
        }

        .search-stats {
            justify-content: flex-start;
        }

        .search-bar {
            flex-wrap: wrap;
        }

        .search-input {
            min-width: calc(100% - 2rem);
            order: 2;
        }

        .search-icon {
            order: 1;
        }

        .clear-btn,
        .search-btn {
            order: 3;
        }

        .search-btn {
            margin-left: auto;
        }
    }

    @media (max-width: 520px) {
        .mode-tabs,
        .genre-filter,
        .select-wrap {
            width: 100%;
        }

        .mode-tab {
            flex: 1;
            justify-content: center;
        }

        .select-wrap {
            justify-content: space-between;
        }

        .result-count {
            width: 100%;
            margin-left: 0;
        }

        .grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
