<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import GameArt from '$lib/components/cards/GameArt.svelte'
    import { getGamePath, launchSteamGame } from '$lib/game-links'
    import { formatPlaytime, getGameImageCandidates } from '$lib/steam-media'

    let {
        game,
        reason,
        score = null,
        sourceLabel = null,
        playtime = 0,
    } = $props()

    let imageSources = $derived(getGameImageCandidates(game, 'capsule'))
    let hours = $derived(formatPlaytime(playtime))

    function openGame() {
        goto(resolve(getGamePath(game?.steam_appid)))
    }
</script>

<div class="suggestion-card" role="link" tabindex="0" onclick={openGame} onkeydown={(event) => event.key === 'Enter' && openGame()}>
    <GameArt appid={game?.steam_appid} title={game?.name} sources={imageSources}>
        <div class="top-meta">
            {#if sourceLabel}
                <span>{sourceLabel}</span>
            {/if}
            {#if score !== null}
                <span>{score}% fit</span>
            {/if}
        </div>
        <div class="bottom-meta">
            <span>{hours}</span>
            <button
                class="play-button"
                aria-label={`Play ${game?.name}`}
                onclick={(event) => {
                    event.stopPropagation()
                    launchSteamGame(game?.steam_appid)
                }}
            >
                <i class="fa-solid fa-play"></i>
            </button>
        </div>
    </GameArt>

    <div class="body">
        <strong>{game?.name}</strong>
        <p>{reason}</p>
    </div>
</div>

<style>
    .suggestion-card {
        width: min(100%, 18rem);
        display: grid;
        gap: 0;
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--panel);
        border: 1px solid var(--panel-border);
        box-shadow: var(--panel-shadow);
        cursor: pointer;
        transition: transform 170ms ease, border-color 170ms ease;
    }

    .suggestion-card:hover,
    .suggestion-card:focus-visible {
        transform: translateY(-4px);
        border-color: var(--panel-border-strong);
    }

    .top-meta,
    .bottom-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.72rem;
    }

    .top-meta span,
    .bottom-meta span {
        padding: 0.3rem 0.62rem;
        border-radius: 999px;
        background: hsl(218, 38%, 8%, 0.72);
        backdrop-filter: blur(10px);
        font-size: 0.72rem;
        font-weight: 700;
    }

    .play-button {
        width: 2.15rem;
        height: 2.15rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: hsl(216, 84%, 56%);
        color: white;
    }

    .body {
        display: grid;
        gap: 0.55rem;
        padding: 0.95rem 1rem 1.05rem;
    }

    strong {
        font-size: 0.95rem;
        line-height: 1.3;
    }

    p {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.8rem;
        line-height: 1.55;
    }
</style>
