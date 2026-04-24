<script>
    import { db } from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import OwnedGameCard from '$lib/components/cards/OwnedGameCard.svelte'
    import StoreGameCard from '$lib/components/cards/StoreGameCard.svelte'

    const GENRE_OPTIONS = [
        'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
        'Sports', 'Racing', 'Puzzle', 'Horror', 'Indie',
        'Casual', 'Shooter', 'Multiplayer', 'Open World', 'Survival',
    ]

    let query = $state('')
    let mode = $state('owned')
    let genreFilter = $state('')
    let storeResults = $state([])
    let loading = $state(false)
    let searched = $state(false)

    let libraryDetails = $derived($db?.cache?.library?.details ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let ownedAppIds = $derived($db?.cache?.library?.appIdList ?? [])

    let ownedResults = $derived(() => {
        if (!query.trim()) return []
        const normalized = query.trim().toLowerCase()

        return ownedAppIds
            .map((appid) => ({
                appid,
                detail: libraryDetails[appid]?.data ?? null,
                playtime: libraryPlaytime[appid] ?? 0,
            }))
            .filter((item) => item.detail?.name?.toLowerCase().includes(normalized))
            .filter((item) => !genreFilter || item.detail?.genres?.some((genre) => genre.description === genreFilter))
            .slice(0, 60)
    })

    async function runSearch() {
        if (!query.trim()) return
        searched = true

        if (mode === 'owned') return

        loading = true
        steamAPI.searchStore(query.trim(), (payload) => {
            storeResults = payload?.items ?? []
            loading = false
        })
    }

    let results = $derived(mode === 'owned' ? ownedResults() : storeResults)
</script>

<div class="search-page">
    <PageHeader
        eyebrow="Search"
        title="Look through your library or step into the Steam store."
        description="Search keeps a simple two-mode flow, but now it uses the same shared cards and canonical game routes as the rest of the app."
    />

    <SurfacePanel>
        <div class="search-shell">
            <div class="mode-row">
                <button class:active={mode === 'owned'} onclick={() => { mode = 'owned'; searched = !!query.trim() }}>My library</button>
                <button class:active={mode === 'store'} onclick={() => { mode = 'store'; if (query.trim()) runSearch() }}>Steam store</button>
            </div>

            <div class="input-row">
                <input bind:value={query} placeholder="Search for a game…" onkeydown={(event) => event.key === 'Enter' && runSearch()} />
                {#if mode === 'owned'}
                    <select bind:value={genreFilter}>
                        <option value="">All genres</option>
                        {#each GENRE_OPTIONS as genre}
                            <option value={genre}>{genre}</option>
                        {/each}
                    </select>
                {/if}
                <button class="btn-primary" onclick={runSearch}>Search</button>
            </div>
        </div>
    </SurfacePanel>

    {#if !searched && !query.trim()}
        <EmptyState icon="magnifying-glass" title="Start typing to search." description="Switch between your library and the Steam store without leaving the shared GameSage card system." />
    {:else if loading}
        <EmptyState icon="circle-notch" title="Searching Steam…" compact />
    {:else if results.length === 0}
        <EmptyState icon="face-frown" title={`No matches for "${query}"`} compact />
    {:else}
        <div class="grid">
            {#if mode === 'owned'}
                {#each ownedResults() as item (item.appid)}
                    <OwnedGameCard
                        appid={item.appid}
                        detail={item.detail}
                        playtime={item.playtime}
                        subtitle={item.detail?.short_description ?? null}
                        accentText={item.detail?.genres?.[0]?.description ?? null}
                    />
                {/each}
            {:else}
                {#each storeResults as item (item.id)}
                    <StoreGameCard
                        appid={item.id}
                        name={item.name}
                        reason={ownedAppIds.includes(item.id) ? 'Already in your library, but still searchable from the store.' : 'View this store listing in the same GameSage visual system.'}
                        price={item.price?.final === 0 ? 'Free' : item.price?.final_formatted ?? null}
                        thumbnail={item.logo}
                        sourceLabel={ownedAppIds.includes(item.id) ? 'Owned' : 'Store'}
                    />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .search-page {
        display: grid;
        gap: 1.2rem;
    }

    .search-shell,
    .mode-row,
    .input-row,
    .grid {
        display: grid;
    }

    .search-shell {
        gap: 1rem;
    }

    .mode-row {
        grid-template-columns: repeat(2, minmax(0, max-content));
        gap: 0.65rem;
    }

    .mode-row button {
        padding: 0.7rem 0.95rem;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        background: var(--panel-soft);
        color: var(--text-muted);
        font-weight: 600;
    }

    .mode-row button.active {
        background: var(--accent-soft);
        border-color: var(--panel-border-strong);
        color: var(--text-primary);
    }

    .input-row {
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 0.8rem;
    }

    .input-row input,
    .input-row select {
        min-height: 3rem;
        padding: 0 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--panel-border);
        background: var(--panel-soft);
    }

    .grid {
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
        gap: 1.2rem;
    }

    @media (max-width: 840px) {
        .input-row {
            grid-template-columns: 1fr;
        }
    }
</style>
