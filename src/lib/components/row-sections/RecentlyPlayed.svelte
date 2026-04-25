<!-- created by Aaron Meche -->
<script>
    import { onMount } from 'svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import { db } from '$lib/data'
    import GameRow from "../games/GameRow.svelte";
    import GameGrid from '../games/GameGrid.svelte';

    let { style = "row" } = $props()
    let recentGames  = $derived($db?.cache?.recentlyPlayed?.data ?? [])
</script>

<!--  -->

<section class="row-section">
    <div class="row-header">
        <div class="row-title">Recently Played</div>
    </div>
    <GameRow games={recentGames} />
</section>

<!--  -->

<style>

</style>