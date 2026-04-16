<script>
    import { db, serverAPI } from "$lib/data"
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import GameGrid from "$lib/components/Suggest/GameGrid.svelte";
    import { app } from "$lib/firebase";
    import { steamAPI } from "$lib/steam";
    import { onMount } from "svelte";

    let games = null
    $: {
        games = $db.cache?.library?.details || []
    }

</script>

<!--  -->

<div class='page'>
    <!-- <div class="warning">This list of games is hardcoded and predetermined.</div> -->
    <div class="filter-stack">
        <FilterStack />
    </div>
    <div class="game-stack">
        <div class="title">Your Library</div>
        {#if games}
            <GameGrid games={games} />
        {/if}
    </div>
</div>

<!--  -->

<style>
    .page{
        display: grid;
        grid-template-columns: min-content auto;
    }

    .title{
        margin-left: 0.4rem;
        margin-bottom: 0.4rem;
        font-size: 2rem;
        font-weight: 700;
    }
</style>