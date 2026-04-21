<script>
    import GameGridItem from '$lib/components/Suggest/GameGridItem.svelte'

    let { games, sorted = null } = $props()

    let items = $derived(() => {
        if (sorted) return sorted
        if (!games) return []
        return Object.values(games).map(g => g.data).filter(Boolean)
    })
</script>

<div class="grid">
    {#each items() as game (game.steam_appid)}
        <GameGridItem {game} />
    {/each}
</div>

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: 0.8rem;
    }
</style>
