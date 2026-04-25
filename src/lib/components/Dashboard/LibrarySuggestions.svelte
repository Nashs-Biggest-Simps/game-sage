<script>
    import { db } from '$lib/data'
    import RowSection from '$lib/components/Suggest/RowSection.svelte'
    import {
        buildLibraryGames,
        buildLocalLibrarySuggestions,
    } from '$lib/suggestions'

    let hasSteamID      = $derived(!!$db?.steamID)
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded ?? [])
    let libraryDetails  = $derived($db?.cache?.library?.details ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})

    let libraryGames = $derived(buildLibraryGames(libraryDetails, libraryPlaytime))

    // Normalize to GameRow format: { appid, name, thumbnail, playtime_forever, reason }
    let games = $derived(
        buildLocalLibrarySuggestions(libraryGames, preferredGenres, excludedGenres)
            .map(({ game, reason }) => ({
                appid: game.steam_appid,
                name: game.name,
                thumbnail: game.thumbnail ?? null,
                playtime_forever: 0,
                reason,
            }))
    )
</script>

<!--  -->

<GameRow games={games} />

<!--  -->

<style>

</style>