<script>
    import { db }                   from '$lib/data'
    import { buildFriendFavorites } from '$lib/suggestions'
    import GameRow                  from '$lib/components/games/GameRow.svelte'

    let friends  = $derived($db?.cache?.friends?.data ?? [])
    let details  = $derived($db?.cache?.library?.details  ?? {})
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let games    = $derived(buildFriendFavorites(friends, details, playtime))
</script>

{#if games.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-users"></i>
            What Friends Are Playing
        </div>
        <span class="live-badge">
            <i class="fa-solid fa-circle live-dot"></i>
            live
        </span>
    </div>
    <GameRow {games} />
</section>
{/if}

<style>
    .live-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.55rem;
        background: var(--la1);
        color: var(--bright-accent);
        border-radius: 100vh;
        outline: solid 1pt var(--la3);
    }
    .live-dot { font-size: 0.35rem; }
</style>
