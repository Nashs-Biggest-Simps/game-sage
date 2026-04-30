<script>
    import GameRecommendationSection            from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db }                    from '$lib/data'
    import { buildFriendGroupFavorites } from '$lib/suggestions'

    let byHour = $derived($db?.cache?.friendPopularity ?? {})
    let games  = $derived(buildFriendGroupFavorites(byHour))
</script>

{#if games.length >= 3}
<GameRecommendationSection
    {games}
    icon="fa-solid fa-fire-flame-curved"
    title="Trending in Your Circle"
    subtitle="past 2 weeks"
/>
{/if}
