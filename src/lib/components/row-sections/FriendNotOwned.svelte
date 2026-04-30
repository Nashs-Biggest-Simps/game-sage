<script>
    import GameRowSection         from '$lib/components/games/GameRowSection.svelte'
    import { db }                 from '$lib/data'
    import { buildFriendNotOwned } from '$lib/suggestions'

    let byHour   = $derived($db?.cache?.friendPopularity ?? {})
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
    let games    = $derived(buildFriendNotOwned(byHour, ownedSet))
</script>

{#if games.length >= 4}
<GameRowSection
    {games}
    icon="fa-solid fa-cart-shopping"
    title="Your Friends Play This"
    subtitle="not in your library"
/>
{/if}
