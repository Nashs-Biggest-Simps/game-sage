<script>
    import GameRow from '$lib/components/games/GameRow.svelte'
    import { db } from '$lib/data'
    import { Algorithm } from '$lib/algorithm'
    import { onMount } from 'svelte'

    const MIN_ROW_ITEMS = 8

    let loadingPlay = $state(false)
    let loadingBuy  = $state(false)

    let playItems = $derived($db?.cache?.suggestions?.play?.items ?? [])
    let buyItems  = $derived($db?.cache?.suggestions?.buy?.items ?? [])

    let libraryGames = $derived(playItems.map(({ game, reason }) => ({
        appid:            game.steam_appid,
        name:             game.name,
        thumbnail:        game.thumbnail ?? null,
        playtime_forever: 0,
        reason,
    })))

    let buyGames = $derived(buyItems.map(({ appid, name, thumbnail, reason }) => ({
        appid,
        name,
        thumbnail,
        playtime_forever: 0,
        reason,
    })))

    onMount(() => {
        const algorithm = new Algorithm()

        if (playItems.length < MIN_ROW_ITEMS) {
            loadingPlay = true
            algorithm.getPlaySuggestions().finally(() => { loadingPlay = false })
        }

        if (buyItems.length < MIN_ROW_ITEMS) {
            loadingBuy = true
            algorithm.getBuySuggestions().finally(() => { loadingBuy = false })
        }
    })
</script>

{#if libraryGames.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Picked From Your Library
        </div>
        <span class="ai-badge">
            <i class="fa-solid fa-robot"></i>
            GameSage AI
        </span>
    </div>
    <GameRow games={libraryGames} />
</section>
{:else if loadingPlay}
<section class="row-section ai-loading">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Picked From Your Library
        </div>
        <span class="ai-badge"><i class="fa-solid fa-circle-notch fa-spin"></i> Thinking</span>
    </div>
</section>
{/if}

{#if buyGames.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-store"></i>
            Picked For You
        </div>
        <span class="ai-badge buy">
            <i class="fa-solid fa-robot"></i>
            GameSage AI
        </span>
    </div>
    <GameRow games={buyGames} />
</section>
{:else if loadingBuy}
<section class="row-section ai-loading">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-store"></i>
            Picked For You
        </div>
        <span class="ai-badge buy"><i class="fa-solid fa-circle-notch fa-spin"></i> Thinking</span>
    </div>
</section>
{/if}

<style>
    .ai-badge {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.55rem;
        background: var(--la1);
        color: var(--bright-accent);
        border-radius: 100vh;
        outline: solid 1pt var(--la3);
    }
    .ai-badge i { font-size: 0.6rem; }

    .ai-badge.buy {
        background: hsl(146, 48%, 20%, 0.44);
        color: hsl(146, 72%, 70%);
        outline-color: hsl(146, 48%, 40%, 0.5);
    }

    .ai-loading {
        min-height: 2.2rem;
    }
</style>
