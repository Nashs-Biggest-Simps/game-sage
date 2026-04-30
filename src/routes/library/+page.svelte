<script>
    import { db } from '$lib/data'
    import GameCardGrid from '$lib/components/game-cards/GameCardGrid.svelte'

    const DISPLAY_OPTIONS = ['All', 'Never Played']
    const SORT_OPTIONS    = ['None', 'Most Played', 'A → Z', 'Z → A', 'Never Played']

    let appIdList   = $derived($db?.cache?.library?.appIdList ?? null)
    let playtime    = $derived($db?.cache?.library?.playtime  ?? {})
    let details     = $derived($db?.cache?.library?.details   ?? {})
    let blacklist   = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let defaultSort    = $derived($db?.prefs?.library?.defaultSort ?? 'None')
    let defaultDisplay = $derived($db?.prefs?.library?.defaultFilter ?? 'All')
    let compactLibrary = $derived($db?.prefs?.display?.compactLibrary ?? false)
    let sortKey        = $derived(SORT_OPTIONS.includes($db?.filters?.Sort) ? $db.filters.Sort : defaultSort)
    let filterMode     = $derived(DISPLAY_OPTIONS.includes($db?.filters?.Display) ? $db.filters.Display : defaultDisplay)
    let steamStatus    = $derived($db?.cache?.status?.steam ?? null)
    let libraryStatus  = $derived($db?.cache?.status?.library ?? null)

    function setFilter(key, value) {
        db.update(d => ({ ...d, filters: { ...d.filters, [key]: value } }))
    }

    let sorted = $derived(() => {
        if (!appIdList) return null

        let arr = appIdList
            .filter(id => !blacklist.has(String(id)))
            .map(id => ({
                ...(details[id]?.data ?? {}),
                appid:            id,
                playtime_forever: playtime[id] ?? 0,
            }))

        if (filterMode === 'Never Played') arr = arr.filter(g => g.playtime_forever === 0)

        switch (sortKey) {
            case 'Most Played':  arr.sort((a, b) => b.playtime_forever - a.playtime_forever); break
            case 'A → Z':        arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')); break
            case 'Z → A':        arr.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? '')); break
            case 'Never Played': arr = arr.filter(g => g.playtime_forever === 0); break
        }

        return arr
    })

    let visibleIds    = $derived(appIdList?.filter(id => !blacklist.has(String(id))) ?? [])
    let total         = $derived(visibleIds.length)
    let shownCount    = $derived(sorted()?.length ?? 0)
    let playedCount   = $derived(visibleIds.filter(id => (playtime[id] ?? 0) > 0).length)
    let unplayedCount = $derived(total - playedCount)
</script>

<div class="page" class:compact={compactLibrary}>

    <!-- ── Header + controls ── -->
    <div class="page-header">
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
    {#if steamStatus?.state === 'missing' || steamStatus?.state === 'invalid' || libraryStatus?.state === 'private' || libraryStatus?.state === 'error'}
        <div class="empty-state warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{libraryStatus?.message ?? steamStatus?.message ?? 'Steam setup needs attention. Check your profile settings.'}</span>
        </div>
    {:else if appIdList === null}
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
            <GameCardGrid items={sorted()} />
        {/if}
    {/if}

</div>

<style>
    .toolbar-left {
        height: 2rem;
        display: flex;
        align-items: center;
        gap: 2rem;
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

    .empty-state.warning {
        color: hsl(38, 80%, 68%);
        opacity: 1;
        outline: solid 1pt hsl(38, 55%, 34%, 0.6);
        background: hsl(38, 45%, 12%, 0.36);
        text-align: center;
        padding: 1.5rem;
    }

    .page.compact :global(.grid) {
        grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
        gap: 1rem 0.65rem;
    }
</style>
