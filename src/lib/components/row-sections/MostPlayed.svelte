<!-- created by Aaron Meche -->
<script>
    import GameRowSection from '$lib/components/games/GameRowSection.svelte';
    import { buildMostPlayedGames } from '$lib/suggestions'
    import { db } from "$lib/data"

    let libraryDetails  = $derived($db?.cache?.library?.details  ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let mostPlayed      = $derived(buildMostPlayedGames(libraryDetails, libraryPlaytime, 12, blacklist))
</script>

<!--  -->

<GameRowSection
    games={mostPlayed}
    icon="fa-solid fa-trophy"
    title="All-Time Favorites"
/>

<!--  -->

<style>

</style>
