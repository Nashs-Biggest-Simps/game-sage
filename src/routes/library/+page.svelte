<script>
    import { onMount } from 'svelte'
    import { applyLibraryDefaults, db, setFilter } from '$lib/data'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import OwnedGameCard from '$lib/components/cards/OwnedGameCard.svelte'

    const DISPLAY_OPTIONS = ['All', 'Never Played']
    const SORT_OPTIONS = ['None', 'Most Played', 'A → Z', 'Z → A', 'Never Played']

    let appIdList = $derived($db?.cache?.library?.appIdList ?? null)
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let details = $derived($db?.cache?.library?.details ?? {})
    let sortKey = $derived($db?.filters?.Sort ?? 'None')
    let filterMode = $derived($db?.filters?.Display ?? 'All')
    let compactLibrary = $derived($db?.prefs?.display?.compactLibrary ?? false)

    let items = $derived(() => {
        if (!appIdList) return []

        let collection = appIdList.map((appid) => ({
            appid,
            playtime: playtime[appid] ?? 0,
            detail: details[appid]?.data ?? null,
        }))

        if (filterMode === 'Never Played') {
            collection = collection.filter((item) => item.playtime === 0)
        }

        switch (sortKey) {
            case 'Most Played':
                collection.sort((left, right) => right.playtime - left.playtime)
                break
            case 'A → Z':
                collection.sort((left, right) => (left.detail?.name ?? '').localeCompare(right.detail?.name ?? ''))
                break
            case 'Z → A':
                collection.sort((left, right) => (right.detail?.name ?? '').localeCompare(left.detail?.name ?? ''))
                break
            case 'Never Played':
                collection = collection.filter((item) => item.playtime === 0)
                break
        }

        return collection
    })

    let total = $derived(appIdList?.length ?? 0)
    let playedCount = $derived(appIdList ? appIdList.filter((appid) => (playtime[appid] ?? 0) > 0).length : 0)
    let unplayedCount = $derived(total - playedCount)

    onMount(() => {
        applyLibraryDefaults()
    })
</script>

<div class="library-page">
    <PageHeader
        eyebrow="Full library view"
        title="Browse your whole Steam collection without losing the signal."
        description="The filter bar stays fixed above the grid, and every library tile uses the same owned-game surface as the rest of the app so the page feels consistent instead of isolated."
    />

    <SurfacePanel>
        <div class="toolbar">
            <div class="summary-chips">
                <span class="chip"><i class="fa-solid fa-folder-open"></i> {total.toLocaleString()} games</span>
                <span class="chip"><i class="fa-solid fa-check"></i> {playedCount.toLocaleString()} played</span>
                <span class="chip"><i class="fa-solid fa-hourglass-half"></i> {unplayedCount.toLocaleString()} unplayed</span>
            </div>

            <div class="controls">
                <label class="select-shell">
                    <span>Display</span>
                    <select value={filterMode} onchange={(event) => setFilter('Display', event.target.value)}>
                        {#each DISPLAY_OPTIONS as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                </label>

                <label class="select-shell">
                    <span>Sort</span>
                    <select value={sortKey} onchange={(event) => setFilter('Sort', event.target.value)}>
                        {#each SORT_OPTIONS as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                </label>
            </div>
        </div>
    </SurfacePanel>

    {#if appIdList === null}
        <EmptyState icon="circle-notch" title="Loading your Steam library." description="Once the cache has your owned list, this page will fill with shared owned-game cards instead of placeholder rows." />
    {:else if appIdList.length === 0}
        <EmptyState icon="gamepad" title="No Steam library detected yet." description="Add your Steam ID in Profile and let GameSage finish the first cache cycle." />
    {:else if items().length === 0}
        <EmptyState icon="filter" title="The current filter combo has no matches." description="Try switching display or sort options to widen the grid again." />
    {:else}
        <div class="grid" class:compact={compactLibrary}>
            {#each items() as item (item.appid)}
                <OwnedGameCard
                    appid={item.appid}
                    detail={item.detail}
                    playtime={item.playtime}
                    compact={compactLibrary}
                    eyebrow={item.playtime === 0 ? 'Unplayed' : null}
                    subtitle={item.detail?.short_description ?? null}
                    accentText={item.detail?.genres?.[0]?.description ?? null}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .library-page {
        display: grid;
        gap: 1.2rem;
    }

    .toolbar,
    .summary-chips,
    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
        align-items: center;
        justify-content: space-between;
    }

    .controls {
        justify-content: flex-end;
    }

    .select-shell {
        display: grid;
        gap: 0.35rem;
        min-width: 10rem;
        padding: 0.82rem 0.95rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
        color: var(--text-muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
    }

    .select-shell select {
        background: transparent;
        border: 0;
        padding: 0;
        color: var(--text-primary);
        font-size: 0.92rem;
        text-transform: none;
        letter-spacing: normal;
        font-weight: 600;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
        gap: 1.45rem 1.35rem;
    }

    .grid.compact {
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    }
</style>
