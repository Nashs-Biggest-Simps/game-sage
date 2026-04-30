<script>
    import GameRecommendationSection            from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db }                    from '$lib/data'
    import { buildFriendGroupFavorites } from '$lib/suggestions'

    const MIN_ROW_ITEMS = 6

    let byHour = $derived($db?.cache?.friendPopularity ?? {})
    let games  = $derived(buildFriendGroupFavorites(byHour))
    let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<GameRecommendationSection
    {games}
    icon="fa-solid fa-fire-flame-curved"
    title="Trending in Your Circle"
    subtitle="past 2 weeks"
    skeletonCount={MIN_ROW_ITEMS}
    {ghostCount}
/>
