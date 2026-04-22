<script>
    import { db } from '$lib/data'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'

    let { game, reason } = $props()

    let imgFailed = $state(false)
    $effect(() => { game?.steam_appid; imgFailed = false })

    let playtime = $derived($db?.cache?.library?.playtime?.[game?.steam_appid] ?? 0)
    let hours    = $derived(Math.round(playtime / 60))

    function launch(e) {
        e.stopPropagation()
        window.location.href = `steam://run/${game.steam_appid}`
    }
</script>

<div
    class="card"
    role="button"
    tabindex="0"
    onclick={() => goto(resolve(`/view?id=${game?.steam_appid}`))}
    onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${game?.steam_appid}`))}
>
    <div class="art-wrap">
        {#if game?.thumbnail && !imgFailed}
            <img
                src={game.thumbnail}
                alt={game?.name}
                loading="lazy"
                onerror={() => imgFailed = true}
            />
        {:else}
            <div class="art-fallback"></div>
        {/if}
        <button class="play-btn" onclick={launch} title="Launch in Steam">
            <i class="fa-solid fa-play"></i>
        </button>
    </div>
    <div class="info">
        <div class="name">{game?.name}</div>
        {#if reason}
            <div class="reason">{reason}</div>
        {/if}
        <div class="playtime">
            {#if hours > 0}{hours}h played{:else}Never played{/if}
        </div>
    </div>
</div>

<style>
    .card {
        display: flex;
        flex-direction: column;
        width: 14rem;
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

    .play-btn {
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

    .card:hover .play-btn {
        opacity: 1;
        transform: scale(1);
    }

    .play-btn:hover { background: var(--accent); }

    .info {
        padding: 0.75rem 0.9rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
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

    .reason {
        font-size: 0.72rem;
        opacity: 0.55;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .playtime {
        font-size: 0.72rem;
        opacity: 0.45;
        margin-top: auto;
        padding-top: 0.5rem;
    }
</style>
