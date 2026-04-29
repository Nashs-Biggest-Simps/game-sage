<script>
    import GameRow                   from '$lib/components/games/GameRow.svelte'
    import { db }                    from '$lib/data'
    import { buildFriendGroupFavorites } from '$lib/suggestions'

    let byHour = $derived($db?.cache?.friendPopularity ?? {})
    let games  = $derived(buildFriendGroupFavorites(byHour))
</script>

{#if games.length >= 3}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-fire-flame-curved"></i>
            Trending in Your Circle
        </div>
        <span class="sub">past 2 weeks</span>
    </div>
    <GameRow {games} />
</section>
{/if}

<style>
    .sub { font-size: 0.72rem; opacity: 0.4; }
</style>
