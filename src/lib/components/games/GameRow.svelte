<script>
    import GameItem from "$lib/components/games/GameItem.svelte";

    let { games = [], inLibrary = true, mode = 'scroll' } = $props()

    let leftFadeOpacity = $state(0)
    function handleScroll(e) {
        const scrollLeft = e.target.scrollLeft
        const pivotPoint = 100
        if (scrollLeft >= pivotPoint) {
            leftFadeOpacity = 1
        }
        else {
            leftFadeOpacity = (scrollLeft / pivotPoint)
        }
    }
</script>

<div class="wrapper">
    {#if mode === 'grid'}
        <div class="grid-track">
            {#each games as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
                <GameItem {game} />
            {/each}
        </div>
    {:else}
        <div
            class="scroll-track horizontal-scroll"
            style="--left-fade-width: {leftFadeOpacity * 4}rem"
            onscroll={(e) => handleScroll(e)}
        >
            {#each games as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
                <GameItem {game} width="14" />
            {/each}
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

    @media (max-width: 620px) {
        .grid-track {
            grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
        }
    }
</style>
