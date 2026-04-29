<!-- created by Aaron Meche -->
<script>
    import GameRow from '$lib/components/games/GameRow.svelte';
    import { buildMostPlayedGames } from '$lib/suggestions'
    import { db } from "$lib/data"

    let libraryDetails  = $derived($db?.cache?.library?.details  ?? {})
    let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist       = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
    let mostPlayed      = $derived(buildMostPlayedGames(libraryDetails, libraryPlaytime, 12, blacklist))
</script>

<!--  -->

<section class="row-section">
    <div class="row-header">
        <div class="row-title">Your Most Played</div>
    </div>
    <GameRow games={mostPlayed} />
</section>

<!--  -->

<style>

</style>