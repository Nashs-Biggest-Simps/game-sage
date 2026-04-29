<script>
    import GameRow from '$lib/components/games/GameRow.svelte'
    import { db } from '$lib/data'
    import { buildLibraryGames, buildGenreWeights, buildGenreSpotlight } from '$lib/suggestions'

    let details        = $derived($db?.cache?.library?.details  ?? {})
    let playtime       = $derived($db?.cache?.library?.playtime ?? {})
    let excludedGenres = $derived($db?.prefs?.genres?.excluded  ?? [])
    let blacklist      = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let libraryGames   = $derived(buildLibraryGames(details, playtime, blacklist))
    let weights        = $derived(buildGenreWeights(libraryGames))
    let topGenre       = $derived([...weights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
    let games          = $derived(buildGenreSpotlight(libraryGames, topGenre, excludedGenres))
</script>

{#if games.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-layer-group"></i>
            More {topGenre}
        </div>
        <span class="sub">unplayed in your library</span>
    </div>
    <GameRow {games} />
</section>
{/if}

<style>
    .sub { font-size: 0.72rem; opacity: 0.4; }
</style>
