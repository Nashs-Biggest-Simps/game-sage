<script>
    import SuggestCard from '$lib/components/Dashboard/SuggestCard.svelte'
    import BuyCard    from '$lib/components/Dashboard/BuyCard.svelte'

    let {
        title,
        type        = 'play',
        items       = [],
        loading     = false,
        libraryCount = null,   // play only: hide/message if library < 10
        onRefresh   = null,    // optional callback to force-refresh suggestions
        onFeedback  = null,    // buy only: (game, liked) => void
    } = $props()

    const SKELETON_COUNT = 5

    // Play suggestions require a library large enough to be meaningful
    let tooSmall = $derived(type === 'play' && libraryCount !== null && libraryCount < 10)
</script>

<section class="row-section">
    <header class="row-header">
        <h2 class="row-title">{title}</h2>

        <span class="ai-badge">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            AI
        </span>

        {#if onRefresh}
            <button
                class="refresh-btn"
                onclick={onRefresh}
                disabled={loading}
                title="Refresh suggestions"
            >
                <i class="fa-solid fa-rotate" class:spinning={loading}></i>
            </button>
        {/if}
    </header>

    {#if tooSmall}
        <div class="unavailable">
            <i class="fa-solid fa-gamepad"></i>
            <span>Library suggestions unlock once you have at least 10 games.</span>
        </div>
    {:else if loading}
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
            <i class="fa-solid fa-{type === 'buy' ? 'magnifying-glass' : 'gamepad'}"></i>
            <span>
                {type === 'buy'
                    ? 'Buy suggestions will appear once your library data loads.'
                    : 'Play suggestions will appear once your library data loads.'}
            </span>
        </div>
    {:else}
        <div class="scroll-track horizontal-scroll">
            {#if type === 'play'}
                {#each items as item (item.game?.steam_appid)}
                    <SuggestCard game={item.game} reason={item.reason} />
                {/each}
            {:else}
                {#each items as item (item.appid)}
                    <BuyCard
                        {...item}
                        onFeedback={onFeedback ? (liked) => onFeedback({ name: item.name }, liked) : null}
                    />
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

    .refresh-btn {
        margin-left: auto;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--l2);
        color: var(--contrast);
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 150ms, background 150ms;
    }

    .refresh-btn:hover:not(:disabled) { opacity: 1; background: var(--l3); }
    .refresh-btn:disabled { cursor: not-allowed; opacity: 0.3; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 0.8s linear infinite; }

    /* ── Scroll track ── */

    .scroll-track {
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 2rem;
        padding-left: 1px;
        padding-right: 1px;
        align-items: stretch;
    }

    /* ── Skeleton cards ── */

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

    /* ── States ── */

    .empty-state,
    .unavailable {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1.4rem 1.6rem;
        background: var(--l1);
        border-radius: 0.9rem;
        font-size: 0.85rem;
        opacity: 0.5;
    }

    .empty-state i,
    .unavailable i { font-size: 1.1rem; flex-shrink: 0; }
</style>
