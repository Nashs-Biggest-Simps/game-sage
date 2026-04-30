<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'
    import { buildLibraryGames, buildGenreWeights, buildGenreSpotlight } from '$lib/suggestions'

    let details        = $derived($db?.cache?.library?.details  ?? {})
    let playtime       = $derived($db?.cache?.library?.playtime ?? {})
    let excludedGenres = $derived($db?.prefs?.genres?.excluded  ?? [])
    let blacklist      = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let libraryGames   = $derived(buildLibraryGames(details, playtime, blacklist))
    let weights        = $derived(buildGenreWeights(libraryGames))
    let topGenre       = $derived([...weights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
    let games          = $derived(buildGenreSpotlight(libraryGames, topGenre, excludedGenres).slice(0, 7))
</script>

{#if games.length > 0}
<div class="panel">
    <div class="panel-title">
        <i class="fa-solid fa-layer-group"></i>
        Unplayed {topGenre}
        <span class="genre-tag">unplayed</span>
    </div>

    <div class="spot-list">
        {#each games as g (g.appid)}
            <div
                class="spot-row"
                role="button"
                tabindex="0"
                onclick={() => goto(resolve(`/view?id=${g.appid}`))}
                onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.appid}`))}
            >
                <div
                    class="spot-art"
                    style="background-image: url('{g.thumbnail ?? `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/capsule_231x87.jpg`}')"
                ></div>
                <div class="spot-name">{g.name}</div>
            </div>
        {/each}
    </div>
</div>
{/if}

<style>
    .genre-tag {
        font-size: 0.58rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        background: var(--l2);
        border-radius: 100vh;
        margin-left: 0.2rem;
        opacity: 0.55;
        vertical-align: middle;
    }

    .spot-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .spot-row {
        display: grid;
        grid-template-columns: 3.6rem 1fr;
        gap: 0.65rem;
        align-items: center;
        padding: 0.4rem 0.5rem 0.4rem 0.4rem;
        border-radius: 0.55rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .spot-row:hover { background: var(--l1); }

    .spot-art {
        width: 3.6rem;
        height: 1.65rem;
        border-radius: 0.3rem;
        background: var(--l2) center / cover no-repeat;
        flex-shrink: 0;
    }

    .spot-name {
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
