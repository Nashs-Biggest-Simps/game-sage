<script>
    import { db } from '$lib/data'
    import FilterStack from '$lib/components/Suggest/FilterStack.svelte'
    import GameGrid from '$lib/components/Suggest/GameGrid.svelte'

    let games        = $derived($db?.cache?.library?.details ?? null)
    let playtime     = $derived($db?.cache?.library?.playtime ?? {})
    let gamesArray   = $derived(games ? Object.values(games).map(g => g.data).filter(Boolean) : [])
    let sortKey      = $derived($db?.filters?.Sort ?? 'Most Played')
    let filterNever  = $derived($db?.filters?.Display === 'Never Played')

    let sorted = $derived(() => {
        let arr = [...gamesArray]
        if (filterNever) arr = arr.filter(g => !playtime[g.steam_appid] || playtime[g.steam_appid] === 0)
        switch (sortKey) {
            case 'Most Played':   return arr.sort((a, b) => (playtime[b.steam_appid] ?? 0) - (playtime[a.steam_appid] ?? 0))
            case 'Never Played':  return arr.filter(g => !playtime[g.steam_appid] || playtime[g.steam_appid] === 0)
            case 'A → Z':         return arr.sort((a, b) => a.name.localeCompare(b.name))
            case 'Z → A':         return arr.sort((a, b) => b.name.localeCompare(a.name))
            default:              return arr
        }
    })
</script>

<div class="page">
    <aside class="filter-sidebar">
        <FilterStack />
    </aside>

    <main class="library-main">
        <div class="header">
            <div class="title">Your Library</div>
            {#if gamesArray.length > 0}
                <div class="count">{gamesArray.length} games</div>
            {/if}
        </div>

        {#if games === null}
            <div class="empty-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>Loading your library…</span>
            </div>
        {:else if gamesArray.length === 0}
            <div class="empty-state">
                <i class="fa-solid fa-gamepad"></i>
                <span>No games found — make sure your Steam ID is set in your profile</span>
            </div>
        {:else}
            <GameGrid games={games} sorted={sorted()} />
        {/if}
    </main>
</div>

<style>
    .page {
        display: grid;
        grid-template-columns: 13rem 1fr;
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

    .title {
        font-size: 2rem;
        font-weight: 700;
    }

    .count {
        font-size: 0.85rem;
        opacity: 0.4;
        font-weight: 500;
    }

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
