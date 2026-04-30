<script>
    import GameRecommendationSection         from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db }                 from '$lib/data'
    import { buildFriendNotOwned } from '$lib/suggestions'

    let byHour   = $derived($db?.cache?.friendPopularity ?? {})
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
    let games    = $derived(buildFriendNotOwned(byHour, ownedSet))
</script>

{#if games.length >= 4}
<GameRecommendationSection
    {games}
    icon="fa-solid fa-cart-shopping"
    title="Your Friends Play This"
    subtitle="not in your library"
/>
{/if}
