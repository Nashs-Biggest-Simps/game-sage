<!-- created by Aaron Meche -->
<script>
    import GameRowItem from "$lib/components/games/GameRowItem.svelte";
    import GameGrid from "./GameGrid.svelte";

    let { games } = $props()
    $effect(() => console.log(games))
</script>

<!--  -->

<div class="scroll-track horizontal-scroll">
    {#each games as game} 
        <GameRowItem game={game} />
    {/each}
</div>

<!--  -->

<style>
    .scroll-track {
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 1px;
        padding-left: 1px;
        padding-right: 1px;
        align-items: stretch;
    }
</style>