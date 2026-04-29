<!-- created by Aaron Meche -->
<script>
    import { db }     from '$lib/data'
    import GameRow    from '../games/GameRow.svelte'

    let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
</script>

<!--  -->

<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-clock-rotate-left"></i>
            Jump Back In
        </div>
    </div>
    <GameRow games={recentGames} />
</section>

<!--  -->

<style>

</style>