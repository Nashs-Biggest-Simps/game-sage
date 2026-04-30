<script>
    import { db }                   from '$lib/data'
    import { buildFriendFavorites } from '$lib/suggestions'
    import GameRowSection           from '$lib/components/games/GameRowSection.svelte'

    let friends  = $derived($db?.cache?.friends?.data ?? [])
    let details  = $derived($db?.cache?.library?.details  ?? {})
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let games    = $derived(buildFriendFavorites(friends, details, playtime))
</script>

{#if games.length > 0}
<GameRowSection
    {games}
    icon="fa-solid fa-users"
    title="What Friends Are Playing"
    badgeLabel="live"
    badgeIcon="fa-solid fa-circle"
    badgeVariant="live"
/>
{/if}
