<script>
    import { db } from "$lib/data"
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import GameGrid from "$lib/components/Suggest/GameGrid.svelte";
    import { app } from "$lib/firebase";

    let games = null
    db.subscribe(data => {
        games = Object.values(data?.algr?.brain?.appdata || {})
        console.log(games)
    })
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
        margin-top: 1.8rem;
        margin-left: 0.4rem;
        margin-bottom: 0.4rem;
        font-size: 2rem;
        font-weight: 700;
    }
</style>