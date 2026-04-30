<script>
    import { db } from '$lib/data'
    import GameCard from './GameCard.svelte';

    const INITIAL_COUNT = 48
    const BATCH_SIZE = 48

    let { items = [] } = $props()
    let visibleCount = $state(INITIAL_COUNT)
    let lastListKey = $state('')

    let listKey = $derived(`${items.length}:${items[0]?.appid ?? items[0]?.steam_appid ?? ''}:${items.at(-1)?.appid ?? items.at(-1)?.steam_appid ?? ''}`)
    let visibleItems = $derived(items.slice(0, visibleCount))
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(id => String(id))))
    let details = $derived($db?.cache?.library?.details ?? {})

    $effect(() => {
        if (listKey !== lastListKey) {
            lastListKey = listKey
            visibleCount = INITIAL_COUNT
        }
    })
</script>

<div class="grid">
    {#each visibleItems as item (item?.appid ?? item?.steam_appid)}
        {@const appid = item?.appid ?? item?.steam_appid}
        <GameCard game={item} owned={ownedSet.has(String(appid))} cachedDetail={details?.[appid]?.data ?? null} />
    {/each}
</div>

{#if items.length > visibleCount}
    <button class="load-more-button" onclick={() => visibleCount += BATCH_SIZE}>
        Show {Math.min(BATCH_SIZE, items.length - visibleCount)} more
        <span>{visibleCount.toLocaleString()} of {items.length.toLocaleString()}</span>
    </button>
{/if}

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 0.8rem;
        padding-top: 4pt;
        padding-left: 1px;
        padding-right: 1px;
        padding-bottom: 1px;
    }
</style>
