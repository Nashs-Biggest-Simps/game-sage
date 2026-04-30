<script>
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db } from '$lib/data'

    const MIN_ROW_ITEMS = 5

    let recent  = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let details = $derived($db?.cache?.library?.details ?? {})

    // Sort by 2-week playtime — different from "Jump Back In" which uses Steam's
    // last-played order. This surfaces what the user has been grinding most.
    let sorted = $derived(
        recent
            .filter(g => (g.playtime_2weeks ?? 0) > 0)
            .sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
    )

    let games = $derived(
        sorted.map(g => {
            const hrs    = Math.round((g.playtime_2weeks ?? 0) / 60)
            const cached = details[g.appid]?.data ?? null
            return {
                appid:            g.appid,
                name:             g.name,
                thumbnail:        cached?.thumbnail ?? null,
                playtime_forever: g.playtime_forever ?? 0,
                reason:           hrs > 0 ? `${hrs}h this week` : 'In rotation this week',
            }
        })
    )
    let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<GameRecommendationSection
    {games}
    icon="fa-solid fa-calendar-week"
    title="On Rotation This Week"
    subtitle="sorted by hours"
    skeletonCount={MIN_ROW_ITEMS}
    {ghostCount}
/>
