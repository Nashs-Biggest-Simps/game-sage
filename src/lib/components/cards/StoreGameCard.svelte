<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import GameArt from '$lib/components/cards/GameArt.svelte'
    import { getGamePath } from '$lib/game-links'
    import { makeStoreThumbnail } from '$lib/steam-media'

    let {
        appid,
        name,
        reason,
        price = null,
        sourceLabel = null,
        thumbnail = null,
        onFeedback = null,
    } = $props()

    let feedback = $state(null)
    let cardUrl = $derived(getGamePath(appid))
    let imageSources = $derived([thumbnail ?? makeStoreThumbnail(appid)])

    function openCard() {
        goto(resolve(cardUrl))
    }

    function setFeedback(event, liked) {
        event.preventDefault()
        event.stopPropagation()
        feedback = liked ? 'liked' : 'disliked'
        onFeedback?.(liked)
    }
</script>

<div class="store-card" role="link" tabindex="0" onclick={openCard} onkeydown={(event) => event.key === 'Enter' && openCard()}>
    <GameArt appid={appid} title={name} sources={imageSources}>
        <div class="top-meta">
            {#if sourceLabel}
                <span>{sourceLabel}</span>
            {/if}
            {#if price}
                <span>{price}</span>
            {/if}
        </div>
        <div class="bottom-meta">
            <span class="store-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Details</span>

            {#if onFeedback}
                <div class="feedback">
                    <button class:active={feedback === 'liked'} onclick={(event) => setFeedback(event, true)} aria-label={`Like ${name}`}>
                        <i class="fa-solid fa-thumbs-up"></i>
                    </button>
                    <button class:active={feedback === 'disliked'} onclick={(event) => setFeedback(event, false)} aria-label={`Dislike ${name}`}>
                        <i class="fa-solid fa-thumbs-down"></i>
                    </button>
                </div>
            {/if}
        </div>
    </GameArt>

    <div class="body">
        <strong>{name}</strong>
        <p>{reason}</p>
    </div>
</div>

<style>
    .store-card {
        width: min(100%, 18rem);
        display: grid;
        gap: 0;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: var(--panel);
        border: 1px solid var(--panel-border);
        box-shadow: var(--panel-shadow);
        transition: transform 170ms ease, border-color 170ms ease;
    }

    .store-card:hover {
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
    .store-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.62rem;
        border-radius: 999px;
        background: hsl(218, 38%, 8%, 0.72);
        backdrop-filter: blur(10px);
        font-size: 0.72rem;
        font-weight: 700;
    }

    .store-pill {
        color: var(--accent-strong);
    }

    .feedback {
        display: flex;
        gap: 0.45rem;
    }

    .feedback button {
        width: 2rem;
        height: 2rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: hsl(218, 38%, 8%, 0.72);
        color: white;
    }

    .feedback button.active {
        background: hsl(213, 82%, 54%);
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
