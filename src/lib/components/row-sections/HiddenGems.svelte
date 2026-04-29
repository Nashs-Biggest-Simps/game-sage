<script>
    import GameRow from '$lib/components/games/GameRow.svelte'
    import { db } from '$lib/data'
    import { buildLibraryGames, buildHiddenGems } from '$lib/suggestions'

    let details         = $derived($db?.cache?.library?.details  ?? {})
    let playtime        = $derived($db?.cache?.library?.playtime ?? {})
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded  ?? [])
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let libraryGames    = $derived(buildLibraryGames(details, playtime, blacklist))

    let gems = $derived(
        buildHiddenGems(libraryGames, preferredGenres, excludedGenres).map(({ game, reason }) => ({
            appid:            game.steam_appid,
            name:             game.name,
            thumbnail:        game.thumbnail ?? null,
            playtime_forever: 0,
            reason,
        }))
    )
</script>

{#if gems.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-gem"></i>
            Hidden Gems
        </div>
        <span class="sub">buried in your library</span>
    </div>
    <GameRow games={gems} />
</section>
{/if}

<style>
    .sub { font-size: 0.72rem; opacity: 0.4; }
</style>
