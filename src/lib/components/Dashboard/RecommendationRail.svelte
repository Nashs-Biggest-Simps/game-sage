<script>
    import SectionHeader from '$lib/components/layout/SectionHeader.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import SuggestionGameCard from '$lib/components/cards/SuggestionGameCard.svelte'
    import StoreGameCard from '$lib/components/cards/StoreGameCard.svelte'

    let {
        title,
        subtitle = null,
        badge = null,
        items = [],
        kind = 'play',
        loading = false,
        emptyTitle = 'Nothing here yet',
        emptyDescription = null,
        onRefresh = null,
        onFeedback = null,
    } = $props()
</script>

<div class="rail">
    <SectionHeader {title} {subtitle} {badge}>
        {#if onRefresh}
            <button class="btn-ghost refresh-button" onclick={onRefresh} disabled={loading}>
                <i class="fa-solid fa-rotate"></i>
                Refresh
            </button>
        {/if}
    </SectionHeader>

    {#if loading}
        <div class="scroll-track horizontal-scroll">
            {#each Array(4) as _}
                <div class="skeleton-card"></div>
            {/each}
        </div>
    {:else if items.length === 0}
        <EmptyState icon={kind === 'buy' ? 'bag-shopping' : 'gamepad'} title={emptyTitle} description={emptyDescription} compact />
    {:else}
        <div class="scroll-track horizontal-scroll">
            {#if kind === 'buy'}
                {#each items as item (item.appid)}
                    <StoreGameCard
                        {...item}
                        onFeedback={onFeedback ? (liked) => onFeedback(item, liked) : null}
                    />
                {/each}
            {:else}
                {#each items as item (item.game?.steam_appid)}
                    <SuggestionGameCard
                        game={item.game}
                        reason={item.reason}
                        score={item.heuristicScore}
                        sourceLabel={item.sourceLabel ?? 'Play next'}
                        playtime={item.playtime ?? 0}
                    />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .rail {
        display: grid;
        gap: 1rem;
    }

    .refresh-button {
        min-height: 0;
        padding: 0.58rem 0.9rem;
    }

    .scroll-track {
        gap: 1rem;
        padding-bottom: 0.2rem;
    }

    .skeleton-card {
        width: 18rem;
        aspect-ratio: 0.88;
        border-radius: var(--radius-md);
        background: linear-gradient(90deg, hsl(214, 26%, 16%), hsl(214, 22%, 22%), hsl(214, 26%, 16%));
        background-size: 200% 100%;
        animation: shimmer 1.8s linear infinite;
        border: 1px solid var(--panel-border);
    }

    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
</style>
