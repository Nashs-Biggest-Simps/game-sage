<!-- created by Aaron Meche -->
<script>
    import { db } from '$lib/data'
    import GameRowSection from '$lib/components/games/GameRowSection.svelte'

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
</script>

<!--  -->

<GameRowSection
    games={recentGames}
    icon="fa-solid fa-clock-rotate-left"
    title="Jump Back In"
/>

<!--  -->

<style>

</style>
