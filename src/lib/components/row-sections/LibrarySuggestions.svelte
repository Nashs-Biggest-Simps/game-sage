<!-- created by Aaron Meche -->
<script>
    import GameRow from '$lib/components/games/GameRow.svelte';
    import { db } from '$lib/data'
    import {
        buildLibraryGames,
        buildLocalLibrarySuggestions,
    } from '$lib/suggestions'

    let hasSteamID      = $derived(!!$db?.steamID)
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded  ?? [])
    let libraryDetails  = $derived($db?.cache?.library?.details  ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

    let libraryGames = $derived(buildLibraryGames(libraryDetails, libraryPlaytime, blacklist))

    // Normalize to GameRow format: { appid, name, thumbnail, playtime_forever, reason }
    let games = $derived(
        buildLocalLibrarySuggestions(libraryGames, preferredGenres, excludedGenres).map(({ game, reason }) => ({
            appid: game.steam_appid,
            name: game.name,
            thumbnail: game.thumbnail ?? null,
            playtime_forever: 0,
            reason,
        }))
    )
</script>

<!--  -->

<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-book-open"></i>
            Suggested from your Library
        </div>
    </div>
    <GameRow games={games} />
</section>

<!--  -->

<style>

</style>