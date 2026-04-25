<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { db } from '$lib/data'

    let { game, width } = $props()

    let appid = $derived(game?.appid ?? game?.steam_appid)
    let owned = $derived(!!$db?.cache?.library?.appIdList?.some(id => Number(id) === Number(appid)))
    let hours = $derived(Math.round((game?.playtime_forever ?? 0) / 60))
    let recentHours = $derived(Math.round((game?.playtime_2weeks ?? 0) / 60))

    let imgFailed = $state(false)
    let thumbnail = $derived(
        game?.thumbnail
        ?? $db?.cache?.library?.details?.[appid]?.data?.thumbnail
        ?? null
    )

    let genres = $derived(
        (game?.genres ?? $db?.cache?.library?.details?.[appid]?.data?.genres ?? [])
            .slice(0, 3)
            .map(g => g.description)
    )

    $effect(() => { appid; imgFailed = false })

    function navigate() {
        goto(resolve(`/view?id=${appid}`))
    }

    function action(e) {
        e.stopPropagation()
        if (owned) {
            window.location.href = `steam://run/${appid}`
        } else {
            window.open(`https://store.steampowered.com/app/${appid}`, '_blank')
        }
    }
</script>

<div
    class="card"
    role="button"
    tabindex="0"
    onclick={navigate}
    onkeydown={(e) => e.key === 'Enter' && navigate()}
    style="width: {width ? width + "rem" : "auto"};"
>
    <div class="art-wrap">
        {#if thumbnail && !imgFailed}
            <img src={thumbnail} alt={game?.name} loading="lazy" onerror={() => imgFailed = true} />
        {:else}
            <div class="art-fallback"></div>
        {/if}

        {#if recentHours > 0}
            <div class="hot-badge">
                <i class="fa-solid fa-fire"></i>
                {recentHours}h this week
            </div>
        {/if}

        {#if hours > 0}
            <div class="hours-badge">
                <i class="fa-solid fa-clock"></i>
                {hours}h
            </div>
        {/if}

        <button
            class="action-btn"
            onclick={action}
            title={owned ? `Launch ${game?.name}` : 'View on Steam Store'}
        >
            <i class="fa-solid fa-{owned ? 'play' : 'arrow-up-right-from-square'}"></i>
        </button>
    </div>

    <div class="info">
        <div class="name">{game?.name}</div>

        {#if genres.length > 0}
            <div class="tags">
                {#each genres as genre}
                    <span class="tag">{genre}</span>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .card {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        border-radius: 0.9rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        cursor: pointer;
        transition: transform 150ms, outline-color 150ms, box-shadow 150ms;
    }

    .card:hover {
        transform: translateY(-3px);
        outline-color: var(--accent);
        box-shadow: 0 8px 24px hsl(0, 0%, 0%, 0.3);
    }

    .art-wrap {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    img {
        width: 100%;
        aspect-ratio: 616 / 353;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .art-fallback {
        width: 100%;
        aspect-ratio: 616 / 353;
        background: var(--l2);
    }

    .card:hover img { transform: scale(1.04); }

    .hot-badge {
        position: absolute;
        top: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.18rem 0.5rem;
        background: hsl(0, 0%, 0%, 0.7);
        border-radius: 100vh;
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--bright-accent);
        backdrop-filter: blur(4px);
        pointer-events: none;
    }

    .hot-badge i { font-size: 0.55rem; }

    .action-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2.2rem;
        height: 2.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(0, 0%, 0%, 0.65);
        border-radius: 100vh;
        font-size: 0.65rem;
        color: white;
        cursor: pointer;
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 150ms, transform 150ms;
        backdrop-filter: blur(4px);
    }

    .card:hover .action-btn {
        opacity: 1;
        transform: scale(1);
    }

    .action-btn:hover { background: var(--accent); }

    .info {
        padding: 0.75rem 0.9rem 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        flex: 1;
    }

    .name {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.1rem;
    }

    .tag {
        font-size: 0.62rem;
        font-weight: 600;
        padding: 0.15rem 0.45rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.75;
        white-space: nowrap;
    }

    .hours-badge {
        position: absolute;
        bottom: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.18rem 0.5rem;
        background: hsl(0, 0%, 0%, 0.75);
        border-radius: 100vh;
        font-size: 0.62rem;
        font-weight: 700;
        color: white;
        backdrop-filter: blur(4px);
        pointer-events: none;
    }

    .hours-badge i { font-size: 0.55rem; }
</style>
