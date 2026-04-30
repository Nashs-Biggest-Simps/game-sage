<script>
    import GameCard from "$lib/components/game-cards/GameCard.svelte";

    const INITIAL_SCROLL_COUNT = 24
    const INITIAL_GRID_COUNT = 120
    const BATCH_SIZE = 24

    let { games = [], mode = 'scroll', loading = false, skeletonCount = 8 } = $props()

    let leftFadeOpacity = $state(0)
    let visibleCount = $state(INITIAL_SCROLL_COUNT)
    let lastRailKey = $state('')

    let railKey = $derived(`${mode}:${loading}:${games.length}:${games[0]?.appid ?? games[0]?.steam_appid ?? ''}:${games.at(-1)?.appid ?? games.at(-1)?.steam_appid ?? ''}`)
    let visibleGames = $derived(games.slice(0, visibleCount))
    let skeletonItems = $derived(Array.from({ length: skeletonCount }))

    $effect(() => {
        if (railKey !== lastRailKey) {
            lastRailKey = railKey
            visibleCount = mode === 'grid' ? INITIAL_GRID_COUNT : INITIAL_SCROLL_COUNT
            leftFadeOpacity = 0
        }
    })

    function handleScroll(e) {
        const scrollLeft = e.target.scrollLeft
        const distanceFromEnd = e.target.scrollWidth - e.target.clientWidth - scrollLeft
        const pivotPoint = 100
        if (scrollLeft >= pivotPoint) {
            leftFadeOpacity = 1
        }
        else {
            leftFadeOpacity = (scrollLeft / pivotPoint)
        }

        if (distanceFromEnd < 700 && visibleCount < games.length) {
            visibleCount = Math.min(games.length, visibleCount + BATCH_SIZE)
        }
    }
</script>

<div class="wrapper">
    {#if mode === 'grid'}
        <div class="grid-track">
            {#if loading}
                {#each skeletonItems as _, i (`grid-skeleton-${i}`)}
                    <div class="game-card-skeleton" aria-hidden="true">
                        <div class="skeleton-art"></div>
                        <div class="skeleton-info">
                            <div class="skeleton-name">Loading Game Title</div>
                            <div class="skeleton-tags">
                                <span>Action</span>
                                <span>Adventure</span>
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                {#each visibleGames as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
                    <GameCard {game} />
                {/each}
            {/if}
        </div>

        {#if !loading && games.length > visibleCount}
            <button class="load-more-button compact" onclick={() => visibleCount = Math.min(games.length, visibleCount + INITIAL_GRID_COUNT)}>
                Show more
                <span>{visibleCount.toLocaleString()} of {games.length.toLocaleString()}</span>
            </button>
        {/if}
    {:else}
        <div
            class="scroll-track horizontal-scroll"
            style="--left-fade-width: {leftFadeOpacity * 4}rem"
            onscroll={(e) => handleScroll(e)}
        >
            {#if loading}
                {#each skeletonItems as _, i (`scroll-skeleton-${i}`)}
                    <div class="game-card-skeleton scroll-size" aria-hidden="true">
                        <div class="skeleton-art"></div>
                        <div class="skeleton-info">
                            <div class="skeleton-name">Loading Game Title</div>
                            <div class="skeleton-tags">
                                <span>Action</span>
                                <span>Adventure</span>
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                {#each visibleGames as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
                    <GameCard {game} width="14" />
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style>
    .wrapper {
        position: relative;
    }

    .scroll-track {
        --left-fade-width: 0rem;
        --right-fade-width: 4rem;
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 1px;
        padding-left: 1px;
        padding-right: 12rem;
        align-items: stretch;
        -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black var(--left-fade-width),
            black calc(100% - var(--right-fade-width)),
            transparent 100%
        );
        mask-image: linear-gradient(
            to right,
            transparent 0,
            black var(--left-fade-width),
            black calc(100% - var(--right-fade-width)),
            transparent 100%
        );
    }

    .grid-track {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
        gap: 0.9rem;
        padding-top: 4pt;
        padding-left: 1px;
        padding-right: 1px;
        padding-bottom: 1px;
    }

    .game-card-skeleton {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        border-radius: 0.9rem;
        overflow: hidden;
        background: hsl(212, 24%, 12%, 0.42);
        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
        backdrop-filter: blur(22px) saturate(1.18);
        -webkit-backdrop-filter: blur(22px) saturate(1.18);
        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
    }

    .game-card-skeleton.scroll-size {
        width: 14rem;
    }

    .skeleton-art,
    .skeleton-name,
    .skeleton-tags span {
        position: relative;
        overflow: hidden;
        background: hsl(212, 24%, 22%, 0.42);
    }

    .skeleton-art::after,
    .skeleton-name::after,
    .skeleton-tags span::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
            90deg,
            transparent,
            hsl(0, 0%, 100%, 0.11),
            transparent
        );
        animation: skeleton-sheen 1.45s ease-in-out infinite;
    }

    .skeleton-art {
        width: 100%;
        aspect-ratio: 616 / 353;
    }

    .skeleton-info {
        padding: 0.75rem 0.9rem 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        flex: 1;
    }

    .skeleton-name {
        width: 82%;
        border-radius: 0.35rem;
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.3;
        color: transparent;
    }

    .skeleton-tags {
        display: flex;
        gap: 0.25rem;
        margin-top: 0.1rem;
    }

    .skeleton-tags span {
        border-radius: 100vh;
        padding: 0.2rem 0.55rem;
        font-size: 0.65rem;
        color: transparent;
    }

    @keyframes skeleton-sheen {
        100% {
            transform: translateX(100%);
        }
    }

    @media (max-width: 620px) {
        .grid-track {
            grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
        }
    }
</style>
