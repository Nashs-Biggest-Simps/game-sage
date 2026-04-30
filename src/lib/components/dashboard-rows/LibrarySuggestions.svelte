<!-- created by Aaron Meche -->
<script>
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte';
    import { db } from '$lib/data'
    import {
        buildLibraryGames,
        buildLocalLibrarySuggestions,
    } from '$lib/suggestions'

    const MIN_ROW_ITEMS = 8

    let hasSteamID      = $derived(!!$db?.steamID)
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded  ?? [])
    let libraryDetails  = $derived($db?.cache?.library?.details  ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

    let libraryGames = $derived(buildLibraryGames(libraryDetails, libraryPlaytime, blacklist))

    // Normalize to GameCardRail format: { appid, name, thumbnail, playtime_forever, reason }
    let games = $derived(
        buildLocalLibrarySuggestions(libraryGames, preferredGenres, excludedGenres).map(({ game, reason }) => ({
            appid: game.steam_appid,
            name: game.name,
            thumbnail: game.thumbnail ?? null,
            playtime_forever: 0,
            reason,
        }))
    )
    let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<!--  -->

<GameRecommendationSection
    {games}
    icon="fa-solid fa-book-open"
    title="Suggested from your Library"
    loading={hasSteamID && !games.length && !Object.keys(libraryDetails).length}
    skeletonCount={MIN_ROW_ITEMS}
    {ghostCount}
/>

<!--  -->

<style>

</style>
