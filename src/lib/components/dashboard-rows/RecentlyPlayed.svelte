<!-- created by Aaron Meche -->
<script>
    import { db } from '$lib/data'
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
</script>

<!--  -->

<GameRecommendationSection
    games={recentGames}
    icon="fa-solid fa-clock-rotate-left"
    title="Jump Back In"
/>

<!--  -->

<style>

</style>
