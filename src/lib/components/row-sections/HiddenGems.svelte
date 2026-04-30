<script>
    import GameRowSection from '$lib/components/games/GameRowSection.svelte'
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
<GameRowSection
    games={gems}
    icon="fa-solid fa-gem"
    title="Hidden Gems"
    subtitle="buried in your library"
/>
{/if}
