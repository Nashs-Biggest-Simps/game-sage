<script>
    import GameArt from '$lib/components/cards/GameArt.svelte'
    import { getGamePath, launchSteamGame } from '$lib/game-links'
    import { getGameImageCandidates } from '$lib/steam-media'

    let {
        game = null,
        detail = null,
        totalHours = 0,
        weekHours = 0,
    } = $props()

    let imageSources = $derived(getGameImageCandidates(detail ?? { steam_appid: game?.appid }, 'hero'))
    let title = $derived(game?.name ?? 'Nothing played recently')
</script>

{#if game}
    <div class="hero">
        <GameArt appid={game.appid} title={title} sources={imageSources} mode="hero" eager>
            <div class="content">
                <div class="eyebrow">Continue Playing</div>
                <div class="copy">
                    <h2>{title}</h2>
                    <p>{totalHours.toLocaleString()}h total{weekHours > 0 ? ` · ${weekHours}h in the last 2 weeks` : ''}</p>
                </div>
                <div class="actions">
                    <button class="btn-primary" onclick={() => launchSteamGame(game.appid)}>
                        <i class="fa-solid fa-play"></i>
                        Play
                    </button>
                    <a class="btn-secondary" href={getGamePath(game.appid)}>
                        View details
                    </a>
                </div>
            </div>
        </GameArt>
    </div>
{:else}
    <div class="hero empty">
        <div class="content">
            <div class="eyebrow">Continue Playing</div>
            <div class="copy">
                <h2>Your next session starts once Steam sync has data.</h2>
                <p>Add your Steam ID in Profile and GameSage will start filling this hero with your most recent game.</p>
            </div>
        </div>
    </div>
{/if}

<style>
    .hero {
        overflow: hidden;
        border-radius: var(--radius-lg);
        border: 1px solid var(--panel-border);
        box-shadow: var(--panel-shadow);
        background: var(--panel);
    }

    .hero.empty {
        min-height: 18rem;
        display: grid;
        align-items: end;
        background:
            radial-gradient(circle at top left, hsl(213, 82%, 56%, 0.2), transparent 34%),
            linear-gradient(180deg, hsl(214, 32%, 18%), hsl(216, 34%, 11%));
    }

    .content {
        height: 100%;
        display: grid;
        align-content: end;
        gap: 0.9rem;
        padding: clamp(1.2rem, 4vw, 2rem);
    }

    .eyebrow {
        display: inline-flex;
        width: fit-content;
        padding: 0.34rem 0.7rem;
        border-radius: 999px;
        background: hsl(218, 38%, 8%, 0.72);
        color: var(--accent-strong);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .copy {
        display: grid;
        gap: 0.45rem;
        max-width: 32rem;
    }

    h2 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.2rem);
        letter-spacing: -0.05em;
        line-height: 1.04;
    }

    p {
        margin: 0;
        color: hsl(214, 26%, 84%);
        line-height: 1.6;
    }

    .actions {
        display: flex;
        gap: 0.8rem;
        flex-wrap: wrap;
    }
</style>
