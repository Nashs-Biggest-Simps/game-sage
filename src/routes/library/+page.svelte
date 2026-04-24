<script>
    import { db } from '$lib/data'
    import GameGrid from '$lib/components/games/GameGrid.svelte'

    const DISPLAY_OPTIONS = ['All', 'Never Played']
    const SORT_OPTIONS    = ['None', 'Most Played', 'A → Z', 'Z → A', 'Never Played']

    let appIdList   = $derived($db?.cache?.library?.appIdList ?? null)
    let playtime    = $derived($db?.cache?.library?.playtime  ?? {})
    let details     = $derived($db?.cache?.library?.details   ?? {})
    let sortKey     = $derived($db?.filters?.Sort    ?? 'None')
    let filterMode  = $derived($db?.filters?.Display ?? 'All')

    function setFilter(key, value) {
        db.update(d => ({ ...d, filters: { ...d.filters, [key]: value } }))
    }

    let sorted = $derived(() => {
        if (!appIdList) return null

        let arr = appIdList.map(id => ({
            appid:    id,
            playtime: playtime[id] ?? 0,
            detail:   details[id]?.data ?? null,
        }))

        if (filterMode === 'Never Played') arr = arr.filter(g => g.playtime === 0)

        switch (sortKey) {
            case 'Most Played':  arr.sort((a, b) => b.playtime - a.playtime); break
            case 'A → Z':        arr.sort((a, b) => (a.detail?.name ?? '').localeCompare(b.detail?.name ?? '')); break
            case 'Z → A':        arr.sort((a, b) => (b.detail?.name ?? '').localeCompare(a.detail?.name ?? '')); break
            case 'Never Played': arr = arr.filter(g => g.playtime === 0); break
        }

        return arr
    })

    let total      = $derived(appIdList?.length ?? 0)
    let shownCount = $derived(sorted()?.length ?? 0)
    let playedCount  = $derived(appIdList ? appIdList.filter(id => (playtime[id] ?? 0) > 0).length : 0)
    let unplayedCount = $derived(total - playedCount)
</script>

<div class="page">

    <!-- ── Header + controls ── -->
    <div class="toolbar">
        <div class="toolbar-left">
            <h1 class="page-title">Library</h1>
            {#if total > 0}
                <div class="stats-chips">
                    <span class="pill">{total.toLocaleString()} games</span>
                    {#if playedCount > 0}
                        <span class="pill accent">{playedCount.toLocaleString()} played</span>
                    {/if}
                    {#if unplayedCount > 0}
                        <span class="pill shadow">{unplayedCount.toLocaleString()} unplayed</span>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="toolbar-right">
            <label class="select-wrap">
                <span class="select-label">Display</span>
                <span class="select-value" aria-hidden="true">{filterMode}</span>
                <select value={filterMode} onchange={(e) => setFilter('Display', e.target.value)}>
                    {#each DISPLAY_OPTIONS as opt}
                        <option value={opt}>{opt}</option>
                    {/each}
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
            </label>

            <label class="select-wrap">
                <span class="select-label">Sort</span>
                <span class="select-value" aria-hidden="true">{sortKey}</span>
                <select
                    value={sortKey}
                    onchange={(e) => setFilter('Sort', e.target.value)}
                >
                    {#each SORT_OPTIONS as opt}
                        <option value={opt}>{opt}</option>
                    {/each}
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
            </label>
        </div>
    </div>

    <!-- ── Content ── -->
    {#if appIdList === null}
        <div class="empty-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Loading your library…</span>
        </div>
    {:else if appIdList.length === 0}
        <div class="empty-state">
            <i class="fa-solid fa-gamepad"></i>
            <span>No games found — make sure your Steam ID is set in your profile</span>
        </div>
    {:else}
        {#if shownCount === 0}
            <div class="empty-state">
                <i class="fa-solid fa-filter"></i>
                <span>No games match the current filters</span>
            </div>
        {:else}
            <GameGrid items={sorted()} />
        {/if}
    {/if}

</div>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
    }

    /* ── Toolbar ──────────────────── */

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.2rem;
        flex-wrap: wrap;
    }

    .toolbar-left {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .page-title {
        font-size: 1.9rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.02em;
    }

    .stats-chips {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.7rem;
    }

    /* ── Dropdowns ────────────────── */

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

    /* ── Empty states ─────────────── */

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        height: 14rem;
        background: var(--l1);
        border-radius: 1.2rem;
        font-size: 0.88rem;
        opacity: 0.45;
    }

    .empty-state i { font-size: 1.4rem; }
</style>
