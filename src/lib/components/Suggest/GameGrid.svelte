<script>
    import GameGridItem from '$lib/components/Suggest/GameGridItem.svelte'

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
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: 0.8rem;
        padding-top: 4pt;
        padding-left: 1px;
        padding-right: 1px;
        padding-bottom: 2rem;
    }
</style>
