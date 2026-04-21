<script>
    import SuggestCard from '$lib/components/Dashboard/SuggestCard.svelte'
    import BuyCard    from '$lib/components/Dashboard/BuyCard.svelte'

    let {
        title,
        type = 'play',
        items = [],
        loading = false,
        emptyIcon = null,
        emptyText = null,
    } = $props()

    const SKELETON_COUNT = 5

    let resolvedIcon = $derived(emptyIcon ?? (type === 'buy' ? 'magnifying-glass' : 'gamepad'))
    let resolvedText = $derived(emptyText ?? (
        type === 'buy'
            ? 'Buy suggestions will appear once your library data loads.'
            : 'Play suggestions will appear once your library data loads.'
    ))
</script>

<section class="row-section">
    <header class="row-header">
        <h2 class="row-title">{title}</h2>
        {#if type === 'buy'}
            <span class="ai-badge">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                AI Picks
            </span>
        {/if}
    </header>

    {#if loading}
        <div class="scroll-track horizontal-scroll">
            {#each Array(SKELETON_COUNT) as _}
                <div class="sk-card">
                    <div class="sk-image"></div>
                    <div class="sk-body">
                        <div class="sk-line" style="width:80%"></div>
                        <div class="sk-line" style="width:55%"></div>
                        <div class="sk-line sk-sm" style="width:38%"></div>
                    </div>
                </div>
            {/each}
        </div>
    {:else if items.length === 0}
        <div class="empty-state">
            <i class="fa-solid fa-{resolvedIcon}"></i>
            <span>{resolvedText}</span>
        </div>
    {:else}
        <div class="scroll-track horizontal-scroll">
            {#if type === 'play'}
                {#each items as item (item.game?.steam_appid)}
                    <SuggestCard game={item.game} reason={item.reason} />
                {/each}
            {:else}
                {#each items as item (item.appid)}
                    <BuyCard {...item} />
                {/each}
            {/if}
        </div>
    {/if}
</section>

<style>
    .row-section {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .row-header {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }

    .row-title {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0;
    }

    .ai-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.2rem 0.65rem;
        background: var(--la1);
        color: var(--bright-accent);
        border-radius: 100vh;
        outline: solid 1pt var(--la3);
    }

    .scroll-track {
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 2rem;
        padding-left: 1px;
        padding-right: 1px;
        align-items: stretch;
    }

    /* ── Structured skeleton cards ── */

    .sk-card {
        width: 14rem;
        flex-shrink: 0;
        border-radius: 0.9rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l2);
    }

    .sk-image {
        width: 100%;
        aspect-ratio: 616 / 353;
        background: linear-gradient(90deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-body {
        padding: 0.75rem 0.9rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .sk-line {
        height: 0.65rem;
        border-radius: 100vh;
        background: linear-gradient(90deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-line.sk-sm { height: 0.5rem; margin-top: 0.2rem; }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    .empty-state {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1.4rem 1.6rem;
        background: var(--l1);
        border-radius: 0.9rem;
        font-size: 0.85rem;
        opacity: 0.5;
    }

    .empty-state i { font-size: 1.1rem; flex-shrink: 0; }
</style>
