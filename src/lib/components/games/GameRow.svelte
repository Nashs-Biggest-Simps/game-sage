<script>
    import GameItem from "$lib/components/games/GameItem.svelte";

    let { games = [], inLibrary = true } = $props()

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
    <div
        class="scroll-track horizontal-scroll"
        style="--left-fade-width: {leftFadeOpacity * 4}rem"
        onscroll={(e) => handleScroll(e)}
    >
        {#each games as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
            <GameItem {game} width="14" />
        {/each}
    </div>
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
</style>
