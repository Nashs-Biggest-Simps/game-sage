<script>
    import GameRow                from '$lib/components/games/GameRow.svelte'
    import { db }                 from '$lib/data'
    import { buildFriendNotOwned } from '$lib/suggestions'

    let byHour   = $derived($db?.cache?.friendPopularity ?? {})
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
    let games    = $derived(buildFriendNotOwned(byHour, ownedSet))
</script>

{#if games.length >= 4}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-cart-shopping"></i>
            Your Friends Play This
        </div>
        <span class="sub">not in your library</span>
    </div>
    <GameRow {games} />
</section>
{/if}

<style>
    .sub { font-size: 0.72rem; opacity: 0.4; }
</style>
