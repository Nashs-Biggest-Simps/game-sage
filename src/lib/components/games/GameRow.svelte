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
    <div class="scroll-track horizontal-scroll" onscroll={(e) => handleScroll(e)}>
        {#each games as game, i (`${game?.appid ?? game?.steam_appid}-${i}`)}
            <GameItem {game} width="14" />
        {/each}
    </div>
    <div class="left fade" style="opacity: {leftFadeOpacity}"></div>
    <div class="right fade"></div>
</div>

<style>
    .wrapper {
        position: relative;
    }

    .scroll-track {
        gap: 0.8rem;
        padding-top: 4pt;
        padding-bottom: 1px;
        padding-left: 1px;
        padding-right: 12rem;
        align-items: stretch;
    }

    .fade {
        position: absolute;
        top: 0;
        height: 100%;
        width: 4rem;
        pointer-events: none;
    }

    .left.fade{
        left: 0;
        background: linear-gradient(to right, var(--bg), transparent);
        opacity: 0;
    }
    .right.fade{
        right: 0;
        background: linear-gradient(to left, var(--bg), transparent);
    }
</style>
