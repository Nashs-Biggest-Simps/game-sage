<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { fetchGameDetail } from '$lib/cache'
    import GameArt from '$lib/components/cards/GameArt.svelte'
    import { getGamePath, launchSteamGame } from '$lib/game-links'
    import { formatPlaytime, getGameImageCandidates, getGenreNames } from '$lib/steam-media'

    let {
        appid,
        playtime = 0,
        detail = null,
        compact = false,
        subtitle = null,
        eyebrow = null,
        accentText = null,
        showPlayButton = true,
    } = $props()

    let localDetail = $state(null)
    let loadingDetail = $state(false)

    $effect(() => {
        appid
        localDetail = detail ?? null
        loadingDetail = false
    })

    let title = $derived(localDetail?.name ?? `App ${appid}`)
    let genres = $derived(getGenreNames(localDetail?.genres).slice(0, compact ? 1 : 2))
    let hoursLabel = $derived(formatPlaytime(playtime))
    let releaseLabel = $derived(localDetail?.release_date?.date ?? null)
    let imageSources = $derived(getGameImageCandidates(localDetail, 'capsule'))

    async function primeDetails() {
        if (localDetail || loadingDetail) return
        loadingDetail = true
        localDetail = await fetchGameDetail(appid)
        loadingDetail = false
    }

    function openDetails() {
        goto(resolve(getGamePath(appid)))
    }

    function onKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openDetails()
        }
    }
</script>

<div
    class="owned-card"
    class:compact
    role="link"
    tabindex="0"
    onmouseenter={primeDetails}
    onfocusin={primeDetails}
    onclick={openDetails}
    onkeydown={onKeydown}
>
    <GameArt appid={appid} title={title} sources={imageSources}>
        <div class="top-meta">
            {#if eyebrow}
                <span class="eyebrow">{eyebrow}</span>
            {/if}
            {#if accentText}
                <span class="accent">{accentText}</span>
            {/if}
        </div>

        <div class="bottom-meta">
            <span class="time">{hoursLabel}</span>
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
    </GameArt>

    <div class="body">
        <div class="title-row">
            <strong>{title}</strong>
            {#if releaseLabel}
                <span>{releaseLabel}</span>
            {:else if loadingDetail}
                <span>Syncing details…</span>
            {/if}
        </div>

        {#if subtitle}
            <p class="subtitle">{subtitle}</p>
        {/if}

        {#if genres.length > 0}
            <div class="tags">
                {#each genres as genre}
                    <span>{genre}</span>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .owned-card {
        display: grid;
        gap: 0;
        border-radius: var(--radius-md);
        background: var(--panel);
        border: 1px solid var(--panel-border);
        overflow: hidden;
        cursor: pointer;
        transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease;
        box-shadow: var(--panel-shadow);
    }

    .owned-card:hover,
    .owned-card:focus-visible {
        transform: translateY(-4px);
        border-color: var(--panel-border-strong);
        box-shadow: 0 28px 54px hsl(221, 68%, 4%, 0.5);
    }

    .owned-card.compact:hover,
    .owned-card.compact:focus-visible {
        transform: translateY(-2px);
    }

    .top-meta,
    .bottom-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.7rem;
    }

    .eyebrow,
    .accent,
    .time {
        display: inline-flex;
        align-items: center;
        padding: 0.3rem 0.62rem;
        border-radius: 999px;
        background: hsl(218, 38%, 8%, 0.72);
        backdrop-filter: blur(10px);
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .accent {
        color: var(--accent-strong);
    }

    .play-button {
        width: 2.2rem;
        height: 2.2rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: hsl(216, 84%, 56%);
        color: white;
        box-shadow: 0 12px 22px hsl(214, 76%, 30%, 0.5);
        transition: transform 140ms ease, background 140ms ease;
    }

    .play-button:hover {
        transform: scale(1.05);
        background: hsl(213, 100%, 65%);
    }

    .body {
        display: grid;
        gap: 0.65rem;
        padding: 0.95rem 1rem 1.05rem;
    }

    .title-row {
        display: grid;
        gap: 0.28rem;
    }

    strong {
        font-size: 0.95rem;
        line-height: 1.3;
    }

    .title-row span,
    .subtitle {
        font-size: 0.78rem;
        line-height: 1.5;
        color: var(--text-muted);
        margin: 0;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: auto;
    }

    .tags span {
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        background: var(--panel-soft);
        color: var(--text-muted);
        font-size: 0.72rem;
        border: 1px solid var(--panel-border);
    }

    .owned-card.compact .body {
        gap: 0.5rem;
        padding: 0.85rem 0.9rem 0.95rem;
    }

    .owned-card.compact strong {
        font-size: 0.9rem;
    }
</style>
