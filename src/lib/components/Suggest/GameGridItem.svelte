<script>
    import { resolve } from '$app/paths'
    import { goto } from '$app/navigation'
    import { db } from '$lib/data'
    import { fetchGameDetail } from '$lib/cache'

    let { appid, playtime = 0 } = $props()

    let detail   = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
    let hours    = $derived(Math.round(playtime / 60))
    let fetching = $state(false)

    let imgIdx  = $state(0)
    let imgUrls = $derived([
        detail?.header_image ?? null,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`,
    ].filter(Boolean))
    let imgSrc    = $derived(imgUrls[imgIdx] ?? null)
    let imgFailed = $derived(imgIdx >= imgUrls.length)

    $effect(() => { appid; imgIdx = 0 })

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

    let metacritic = $derived(detail?.metacritic?.score ?? null)
    let topGenres  = $derived(detail?.genres?.slice(0, 2).map(g => g.description) ?? [])
</script>

<div
    class="card {!detail ? 'uncached' : ''}"
    role="button"
    tabindex="0"
    onmouseenter={onMouseEnter}
    onclick={handleClick}
    onkeydown={(e) => e.key === 'Enter' && handleClick(e)}
>
    <!-- ── Thumbnail ── -->
    <div class="thumb-wrap">
        {#if detail && imgSrc && !imgFailed}
            <img src={imgSrc} alt={detail.name} loading="lazy" onerror={nextImg} />
        {:else if detail && imgFailed}
            <div class="img-placeholder"></div>
        {:else}
            <div class="img-gradient">
                {#if fetching}
                    <i class="fa-solid fa-circle-notch fa-spin loading-icon"></i>
                {/if}
            </div>
        {/if}

        <!-- Playtime badge -->
        {#if hours > 0}
            <div class="playtime-badge">
                <i class="fa-solid fa-clock"></i>
                {hours >= 1000 ? `${(hours/1000).toFixed(1)}k` : hours.toLocaleString()}h
            </div>
        {:else if detail}
            <div class="playtime-badge unplayed">Unplayed</div>
        {/if}

        <!-- Metacritic badge -->
        {#if metacritic}
            <div class="meta-badge {metacritic >= 75 ? 'great' : metacritic >= 50 ? 'mixed' : 'poor'}">
                {metacritic}
            </div>
        {/if}

        <!-- Hover overlay -->
        {#if detail}
            <div class="thumb-overlay">
                <button
                    class="btn-play"
                    aria-label="Play {detail.name}"
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

    <!-- ── Info ── -->
    <div class="info">
        {#if detail}
            <div class="name">{detail.name}</div>
        {:else}
            <div class="name-placeholder"></div>
        {/if}

        {#if topGenres.length}
            <div class="tags">
                {#each topGenres as genre}
                    <span class="tag">{genre}</span>
                {/each}
            </div>
        {:else if detail}
            <div class="tags-placeholder"></div>
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
        box-shadow: 0 8px 28px hsl(0, 0%, 0%, 0.35);
    }

    .card.uncached { cursor: default; }
    .card.uncached:hover { outline-color: var(--l3); box-shadow: none; transform: none; }

    /* ── Thumbnail ─────────────────── */

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
        transition: transform 200ms;
    }

    .card:not(.uncached):hover img { transform: scale(1.05); }

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

    .img-placeholder { width: 100%; height: 100%; background: var(--l2); }

    @keyframes gradshift {
        0%, 100% { background-position: 0% 50%; }
        50%       { background-position: 100% 50%; }
    }

    .loading-icon { font-size: 1.2rem; opacity: 0.4; }

    /* ── Badges ────────────────────── */

    .playtime-badge {
        position: absolute;
        bottom: 0.5rem;
        left: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.6rem;
        background: hsl(0, 0%, 0%, 0.72);
        backdrop-filter: blur(6px);
        border-radius: 100vh;
        font-size: 0.78rem;
        font-weight: 700;
        color: white;
        letter-spacing: 0.01em;
    }

    .playtime-badge i { font-size: 0.6rem; opacity: 0.8; }

    .playtime-badge.unplayed {
        color: hsl(0, 0%, 100%, 0.45);
        font-weight: 500;
    }

    .meta-badge {
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        border-radius: 0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        font-weight: 800;
        color: white;
    }

    .meta-badge.great   { background: hsl(145, 60%, 35%); }
    .meta-badge.mixed   { background: hsl(45,  70%, 40%); }
    .meta-badge.poor    { background: hsl(0,   65%, 45%); }

    /* ── Hover overlay ─────────────── */

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
        padding: 0.55rem 1.3rem;
        background: var(--accent);
        border-radius: 0.6rem;
        font-size: 0.88rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: background 120ms, transform 100ms;
    }

    .btn-play:hover { background: var(--bright-accent); transform: scale(1.05); }

    .uncached-hint {
        position: absolute;
        bottom: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.68rem;
        opacity: 0;
        background: hsl(0, 0%, 0%, 0.6);
        padding: 0.2rem 0.55rem;
        border-radius: 100vh;
        white-space: nowrap;
        transition: opacity 150ms;
        pointer-events: none;
    }

    .card.uncached:hover .uncached-hint { opacity: 1; }

    /* ── Info ──────────────────────── */

    .info {
        padding: 0.8rem 0.9rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .name {
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .name-placeholder {
        height: 1rem;
        width: 72%;
        border-radius: 100vh;
        background: linear-gradient(90deg, var(--l2) 0%, var(--l3) 50%, var(--l2) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.8s ease-in-out infinite;
    }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    .tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }

    .tag {
        font-size: 0.72rem;
        font-weight: 500;
        padding: 0.2rem 0.55rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.8;
    }

    .tags-placeholder {
        height: 0.72rem;
        width: 45%;
        border-radius: 100vh;
        background: var(--l2);
        opacity: 0.4;
    }
</style>
