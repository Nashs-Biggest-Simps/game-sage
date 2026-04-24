<script>
    import { getFriendBuckets } from '$lib/insights'

    let { friends = [] } = $props()

    let buckets = $derived(getFriendBuckets(friends))
    let visible = $derived([...buckets.inGame, ...buckets.online].slice(0, 8))

    function label(friend) {
        if (friend.gameextrainfo) return friend.gameextrainfo
        if ((friend.personastate ?? 0) > 0) return 'Online'
        return 'Offline'
    }
</script>

<div class="friend-snapshot">
    <div class="summary-row">
        <div><strong>{friends.length}</strong><span>friends</span></div>
        <div><strong>{buckets.online.length + buckets.inGame.length}</strong><span>online</span></div>
        <div><strong>{buckets.inGame.length}</strong><span>in game</span></div>
    </div>

    <div class="friend-list">
        {#each visible as friend (friend.steamid)}
            <div class="friend-row">
                <img src={friend.avatarfull} alt="" loading="lazy" />
                <div class="copy">
                    <strong>{friend.personaname}</strong>
                    <span>{label(friend)}</span>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .friend-snapshot,
    .friend-list {
        display: grid;
        gap: 0.9rem;
    }

    .summary-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.7rem;
    }

    .summary-row div {
        display: grid;
        gap: 0.15rem;
        padding: 0.85rem 0.9rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .summary-row strong {
        font-size: 1.25rem;
    }

    .summary-row span,
    .copy span {
        color: var(--text-muted);
        font-size: 0.76rem;
    }

    .friend-row {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem;
        align-items: center;
        padding: 0.3rem 0;
    }

    img {
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 999px;
        object-fit: cover;
    }

    .copy {
        display: grid;
        gap: 0.2rem;
        min-width: 0;
    }

    .copy strong {
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
