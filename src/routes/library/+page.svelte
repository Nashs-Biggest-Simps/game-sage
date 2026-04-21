<script>
    import { db } from '$lib/data'
    import FilterStack from '$lib/components/Suggest/FilterStack.svelte'
    import GameGrid from '$lib/components/Suggest/GameGrid.svelte'

    let appIdList  = $derived($db?.cache?.library?.appIdList ?? null)
    let playtime   = $derived($db?.cache?.library?.playtime  ?? {})
    let details    = $derived($db?.cache?.library?.details   ?? {})
    let sortKey    = $derived($db?.filters?.Sort    ?? 'None')
    let filterMode = $derived($db?.filters?.Display ?? 'All')

    let sorted = $derived(() => {
        if (!appIdList) return null

        let arr = appIdList.map(id => ({
            appid:    id,
            playtime: playtime[id] ?? 0,
            detail:   details[id]?.data ?? null,
        }))

        if (filterMode === 'Never Played') arr = arr.filter(g => g.playtime === 0)

        switch (sortKey) {
            case 'Most Played':     arr.sort((a, b) => b.playtime - a.playtime);              break
            case 'Recently Played': arr.sort((a, b) => b.playtime - a.playtime);              break
            case 'Never Played':    arr = arr.filter(g => g.playtime === 0);                  break
            case 'A → Z':           arr.sort((a, b) => (a.detail?.name ?? '').localeCompare(b.detail?.name ?? '')); break
            case 'Z → A':           arr.sort((a, b) => (b.detail?.name ?? '').localeCompare(a.detail?.name ?? '')); break
        }

        return arr
    })

    let total = $derived(appIdList?.length ?? 0)
</script>

<div class="page">
    <aside class="filter-sidebar">
        <FilterStack />
    </aside>

    <main class="library-main">
        <div class="header">
            <div class="title">Your Library</div>
            {#if total > 0}
                <div class="count">{total} games</div>
            {/if}
        </div>

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
            <GameGrid items={sorted()} />
        {/if}
    </main>
</div>

<style>
    .page {
        display: grid;
        grid-template-columns: 13rem minmax(0, 1fr);
        gap: 2.4rem;
        align-items: start;
    }

    .filter-sidebar {
        position: sticky;
        top: 2.4rem;
    }

    .library-main {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    .header {
        display: flex;
        align-items: baseline;
        gap: 0.8rem;
    }

    .title { font-size: 2rem; font-weight: 700; }

    .count { font-size: 0.85rem; opacity: 0.4; font-weight: 500; }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
        height: 12rem;
        background: var(--l1);
        border-radius: 1.2rem;
        font-size: 0.88rem;
        opacity: 0.45;
    }

    .empty-state i { font-size: 1.4rem; }
</style>
