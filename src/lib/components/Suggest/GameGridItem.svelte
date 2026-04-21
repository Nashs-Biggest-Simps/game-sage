<script>
    import { resolve } from '$app/paths'
    import { goto } from '$app/navigation'
    import { db } from '$lib/data'
    import { fetchGameDetail } from '$lib/cache'

    let { appid, playtime = 0 } = $props()

    let detail   = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
    let hours    = $derived(Math.round(playtime / 60))
    let fetching = $state(false)

    // $state-driven image fallback — avoids Svelte re-binding the broken src
    let imgIdx  = $state(0)
    const IMGS  = (id) => [
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
    ]
    let imgSrc    = $derived(IMGS(appid)[imgIdx] ?? null)
    let imgFailed = $derived(imgIdx >= IMGS(appid).length)

    $effect(() => { appid; imgIdx = 0 })   // reset when appid changes

    function nextImg() { imgIdx++ }

    async function onMouseEnter() {
        if (!detail && !fetching) {
            fetching = true
            await fetchGameDetail(appid)
            fetching = false
        }
    }

    function handleClick(e) {
        if (!detail) { e.preventDefault(); return }
        goto(resolve(`/view?id=${appid}`))
    }
</script>

<div
    class="card {!detail ? 'uncached' : ''}"
    role="button"
    tabindex="0"
    onmouseenter={onMouseEnter}
    onclick={handleClick}
    onkeydown={(e) => e.key === 'Enter' && handleClick(e)}
>
    <div class="thumb-wrap">
        {#if detail && imgSrc && !imgFailed}
            <img src={imgSrc} alt={detail.name} loading="lazy" onerror={nextImg} />
        {:else if detail && imgFailed}
            <div class="img-placeholder"></div>
        {:else}
            <!-- uncached: gradient placeholder -->
            <div class="img-gradient">
                {#if fetching}
                    <i class="fa-solid fa-circle-notch fa-spin loading-icon"></i>
                {/if}
            </div>
        {/if}

        {#if detail}
            <div class="thumb-overlay">
                <button
                    class="btn-play"
                    onclick={(e) => { e.stopPropagation(); window.location.href = `steam://run/${appid}` }}
                >
                    <i class="fa-solid fa-play"></i>
                    Play
                </button>
            </div>
        {:else if !fetching}
            <div class="uncached-hint">Hover to load</div>
        {/if}
    </div>

    <div class="info">
        {#if detail}
            <div class="name">{detail.name}</div>
        {:else}
            <div class="name-placeholder"></div>
        {/if}
        <div class="meta">
            {#if hours > 0}
                {hours.toLocaleString()}h played
            {:else if detail}
                Never played
            {:else}
                &nbsp;
            {/if}
        </div>
        {#if detail?.genres?.length}
            <div class="tags">
                {#each detail.genres.slice(0, 2) as genre}
                    <span class="tag">{genre.description}</span>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .card {
        display: flex;
        flex-direction: column;
        border-radius: 0.9rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l2);
        cursor: pointer;
        transition: transform 180ms, outline-color 180ms, box-shadow 180ms;
    }

    .card:hover {
        transform: translateY(-3px);
        outline-color: var(--accent);
        box-shadow: 0 8px 24px hsl(0, 0%, 0%, 0.3);
    }

    .card.uncached { cursor: default; }
    .card.uncached:hover { outline-color: var(--l3); box-shadow: none; transform: none; }

    /* ── Thumbnail ───────────────── */

    .thumb-wrap {
        position: relative;
        overflow: hidden;
        aspect-ratio: 616 / 353;
        background: var(--l2);
    }

    .thumb-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 180ms;
    }

    .card:not(.uncached):hover img { transform: scale(1.04); }

    .img-gradient {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 200%;
        animation: gradshift 3s ease-in-out infinite;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .img-placeholder {
        width: 100%;
        height: 100%;
        background: var(--l2);
    }

    @keyframes gradshift {
        0%, 100% { background-position: 0% 50%;   }
        50%       { background-position: 100% 50%; }
    }

    .loading-icon { font-size: 1.2rem; opacity: 0.4; }

    /* ── Overlays ────────────────── */

    .thumb-overlay {
        position: absolute;
        inset: 0;
        background: hsl(0, 0%, 0%, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 150ms;
    }

    .card:hover .thumb-overlay { opacity: 1; }

    .btn-play {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 1.2rem;
        background: var(--accent);
        border-radius: 0.55rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: background 120ms, transform 100ms;
    }

    .btn-play:hover { background: var(--bright-accent); transform: scale(1.04); }

    .uncached-hint {
        position: absolute;
        bottom: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.68rem;
        opacity: 0;
        background: hsl(0,0%,0%,0.6);
        padding: 0.2rem 0.55rem;
        border-radius: 100vh;
        white-space: nowrap;
        transition: opacity 150ms;
        pointer-events: none;
    }

    .card.uncached:hover .uncached-hint { opacity: 1; }

    /* ── Info ────────────────────── */

    .info {
        padding: 0.75rem 0.85rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 3.5rem;
    }

    .name {
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .name-placeholder {
        height: 0.9rem;
        width: 70%;
        border-radius: 100vh;
        background: var(--l3);
        animation: shimmer 1.8s ease-in-out infinite;
        background: linear-gradient(90deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 100%;
    }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    .meta { font-size: 0.75rem; opacity: 0.5; }

    .tags { display: flex; gap: 0.35rem; margin-top: 0.2rem; flex-wrap: wrap; }

    .tag {
        font-size: 0.68rem;
        padding: 0.2rem 0.5rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.75;
    }
</style>
