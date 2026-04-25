<script>
    import { db } from '$lib/data'
    import { buildLibraryGames, buildMostPlayedGames } from '$lib/suggestions'

    import RowSection              from '$lib/components/Suggest/RowSection.svelte'
    import LibrarySuggestions      from '$lib/components/Suggest/LibrarySuggestions.svelte'
    import FriendsPlayingSuggestions from '$lib/components/Suggest/FriendsPlayingSuggestions.svelte'
    import HotSuggestions          from '$lib/components/Suggest/HotSuggestions.svelte'
    import AiSuggestions           from '$lib/components/Suggest/AiSuggestions.svelte'
    import PreferencesSummary      from '$lib/components/Suggest/PreferencesSummary.svelte'

    let hasSteamID      = $derived(!!$db?.steamID)
    let libraryDetails  = $derived($db?.cache?.library?.details ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let recentlyPlayed  = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded ?? [])
    let activeFilterCount = $derived(preferredGenres.length + excludedGenres.length)

    // "Jump Back In" — recently played, already in GameRow format (appid/name/playtime_forever)
    let jumpBackIn = $derived(recentlyPlayed.slice(0, 12))

    // "Most Played" — library sorted by total playtime
    let mostPlayed = $derived(buildMostPlayedGames(libraryDetails, libraryPlaytime))

    let hasLibraryData = $derived(Object.keys(libraryDetails).length > 0)
</script>

<div class="page">
    <div class="page-header">
        <div class="page-title">Suggestions</div>
    </div>

    <div class="page-content">
        <div class="left">
            <!-- Jump Back In: recently played games -->
            {#if jumpBackIn.length > 0}
                <RowSection
                    title="Jump Back In"
                    games={jumpBackIn}
                    inLibrary={true}
                    emptyIcon="clock-rotate-left"
                />
            {/if}

            <!-- Suggested from your Library: unplayed, genre-matched (no AI) -->
            <LibrarySuggestions />

            <!-- Most Played: top games by total playtime -->
            {#if hasSteamID}
                <RowSection
                    title="Most Played Games"
                    games={mostPlayed}
                    {hasSteamID}
                    inLibrary={true}
                    emptyIcon="trophy"
                    emptyText={hasLibraryData
                        ? 'No playtime data found yet.'
                        : 'Most played games appear as your library loads.'}
                />
            {/if}

            <!-- Friends playing right now (hidden if fewer than 2 friends in game) -->
            <FriendsPlayingSuggestions />

            <!-- Picked for You: AI buy suggestions (one AI call, cached 24h) -->
            <AiSuggestions kind="buy" title="Picked for You" />

            <!-- Hot Right Now: Steam top sellers / deals (no AI, store data) -->
            <HotSuggestions />
        </div>
    </div>
</div>

<style>
    .page-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 2rem;
        align-items: start;
    }
</style>
