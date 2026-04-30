<script>
    import GameRecommendationSection         from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db }                 from '$lib/data'
    import { buildFriendNotOwned } from '$lib/suggestions'

    const MIN_ROW_ITEMS = 6

    let byHour   = $derived($db?.cache?.friendPopularity ?? {})
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
    let games    = $derived(buildFriendNotOwned(byHour, ownedSet))
    let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<GameRecommendationSection
    {games}
    icon="fa-solid fa-cart-shopping"
    title="Your Friends Play This"
    subtitle="not in your library"
    skeletonCount={MIN_ROW_ITEMS}
    {ghostCount}
/>
