<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import GameArt from '$lib/components/cards/GameArt.svelte'
    import { getGamePath, launchSteamGame } from '$lib/game-links'
    import { getGameImageCandidates } from '$lib/steam-media'

    let {
        appid,
        title,
        detail = null,
        eyebrow = null,
        primaryMeta,
        secondaryMeta = null,
        accentText = null,
        showPlayButton = true,
    } = $props()

    let imageSources = $derived(getGameImageCandidates(detail ?? { steam_appid: appid }, 'capsule'))

    function openGame() {
        goto(resolve(getGamePath(appid)))
    }
</script>

<div class="activity-card" role="link" tabindex="0" onclick={openGame} onkeydown={(event) => event.key === 'Enter' && openGame()}>
    <div class="art-shell">
        <GameArt appid={appid} title={title} sources={imageSources} shade={false} />
    </div>

    <div class="content">
        <div class="top">
            {#if eyebrow}
                <span class="eyebrow">{eyebrow}</span>
            {/if}
            {#if accentText}
                <span class="accent">{accentText}</span>
            {/if}
        </div>

        <div class="copy">
            <strong>{title}</strong>
            <span>{primaryMeta}</span>
            {#if secondaryMeta}
                <small>{secondaryMeta}</small>
            {/if}
        </div>

        {#if showPlayButton}
            <button
                class="play-button"
                aria-label={`Play ${title}`}
                onclick={(event) => {
                    event.stopPropagation()
                    launchSteamGame(appid)
                }}
            >
                <i class="fa-solid fa-play"></i>
            </button>
        {/if}
    </div>
</div>

<style>
    .activity-card {
        display: grid;
        grid-template-columns: 8.25rem minmax(0, 1fr);
        gap: 0.95rem;
        padding: 0.85rem;
        border-radius: var(--radius-md);
        background: var(--panel);
        border: 1px solid var(--panel-border);
        box-shadow: var(--panel-shadow);
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease;
    }

    .activity-card:hover,
    .activity-card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--panel-border-strong);
    }

    .art-shell {
        overflow: hidden;
        border-radius: 0.9rem;
    }

    .content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.8rem;
        align-items: center;
    }

    .top,
    .copy {
        display: grid;
        gap: 0.35rem;
    }

    .eyebrow,
    .accent {
        width: fit-content;
        padding: 0.26rem 0.56rem;
        border-radius: 999px;
        background: var(--panel-strong);
        border: 1px solid var(--panel-border);
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--accent-strong);
    }

    strong {
        font-size: 0.92rem;
        line-height: 1.3;
    }

    span,
    small {
        color: var(--text-muted);
        line-height: 1.5;
    }

    span {
        font-size: 0.8rem;
    }

    small {
        font-size: 0.74rem;
    }

    .play-button {
        width: 2.25rem;
        height: 2.25rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: hsl(216, 84%, 56%);
        color: white;
    }

    @media (max-width: 720px) {
        .activity-card {
            grid-template-columns: 1fr;
        }
    }
</style>
