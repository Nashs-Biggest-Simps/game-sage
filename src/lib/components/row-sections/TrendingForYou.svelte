<script>
    import GameRowSection from '$lib/components/games/GameRowSection.svelte'
    import { db } from '$lib/data'
    import { buildLibraryGames, buildGenreWeights } from '$lib/suggestions'

    const TAG_LABEL = { new: 'New Release', top: 'Top Seller', sale: 'On Sale' }

    let trending = $derived($db?.cache?.trending?.items ?? [])
    let details  = $derived($db?.cache?.library?.details  ?? {})
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

    // Build top-genre list to score trending games for "for you" relevance
    let libraryGames = $derived(buildLibraryGames(details, playtime, blacklist))
    let weights      = $derived(buildGenreWeights(libraryGames))
    let topGenres    = $derived(
        new Set(
            [...weights.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([g]) => g.toLowerCase())
        )
    )

    // Cross-reference trending appids with library.details for genre matching;
    // boost games whose genres overlap the user's top-5 genres.
    let owned = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))

    let games = $derived(
        trending
            .filter(g => !owned.has(String(g.appid)))
            .map(g => {
                const cached    = details[g.appid]?.data ?? null
                const genres    = (cached?.genres ?? []).map(d => d.description.toLowerCase())
                const genreHit  = genres.find(genre => topGenres.has(genre))
                const label     = TAG_LABEL[g.tag] ?? 'Trending'
                return {
                    appid:            g.appid,
                    name:             g.name,
                    thumbnail:        g.thumbnail,
                    playtime_forever: 0,
                    reason:           genreHit
                        ? `${label} · matches your ${genres.find(genre => topGenres.has(genre))?.replace(/^\w/, c => c.toUpperCase())} taste`
                        : label,
                    _genreScore: genres.filter(gr => topGenres.has(gr)).length,
                }
            })
            .sort((a, b) => b._genreScore - a._genreScore)
            .slice(0, 12)
    )
</script>

{#if games.length >= 3}
<GameRowSection
    {games}
    icon="fa-solid fa-chart-line"
    title="New & Trending For You"
    subtitle="from Steam charts"
/>
{/if}
