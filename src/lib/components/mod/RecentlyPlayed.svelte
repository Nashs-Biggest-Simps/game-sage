<!-- created by Aaron Meche -->
<script>
    import { onMount } from 'svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import { db } from '$lib/data'
    import GameRow from "../games/GameRow.svelte";
    import GameGrid from '../games/GameGrid.svelte';

    let { style = "row" } = $props()
    let recentGames  = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    
    let isPortrait = $state(false);

    function handleResize() {
        const matches = window.matchMedia('(orientation: portrait)').matches
        isPortrait = window.matchMedia('(orientation: portrait)').matches;
    }

    onMount(handleResize)
</script>

<!--  -->

<svelte:window on:resize={handleResize} />

{#if style == "row" || isPortrait}
    <GameRow games={recentGames} />
{:else if style == "grid"}
    <GameGrid items={recentGames} />
{/if}

<!--  -->

<style lang="rue">

</style>