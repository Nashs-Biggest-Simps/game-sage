<script>
    import GameGridItem from '$lib/components/games/GameGridItem.svelte'

    let { items = [] } = $props()
</script>

<div class="grid">
    {#each items as item (item.appid)}
        <GameGridItem appid={item.appid} playtime={item.playtime} />
    {/each}
</div>

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1.6rem 0.8rem;
        padding-top: 4pt;
        padding-left: 1px;
        padding-right: 1px;
        padding-bottom: 1px;
    }
</style>
