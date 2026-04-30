<!-- created by Aaron Meche -->
<script>
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte';
    import { buildMostPlayedGames } from '$lib/suggestions'
    import { db } from "$lib/data"

    const MIN_ROW_ITEMS = 5

    let libraryDetails  = $derived($db?.cache?.library?.details  ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let mostPlayed      = $derived(buildMostPlayedGames(libraryDetails, libraryPlaytime, 12, blacklist))
    let ghostCount      = $derived(Math.max(MIN_ROW_ITEMS - mostPlayed.length, 0))
</script>

<!--  -->

<GameRecommendationSection
    games={mostPlayed}
    icon="fa-solid fa-trophy"
    title="All-Time Favorites"
    skeletonCount={MIN_ROW_ITEMS}
    {ghostCount}
/>

<!--  -->

<style>

</style>
