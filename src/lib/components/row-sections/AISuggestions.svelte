<script>
    import GameRow from '$lib/components/games/GameRow.svelte'
    import { db } from '$lib/data'

    let items = $derived($db?.cache?.suggestions?.play?.items ?? [])
    let games = $derived(items.map(({ game, reason }) => ({
        appid:            game.steam_appid,
        name:             game.name,
        thumbnail:        game.thumbnail ?? null,
        playtime_forever: 0,
        reason,
    })))
</script>

{#if games.length > 0}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Picked For You
        </div>
        <span class="ai-badge">
            <i class="fa-solid fa-robot"></i>
            Claude AI
        </span>
    </div>
    <GameRow {games} />
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
</style>
