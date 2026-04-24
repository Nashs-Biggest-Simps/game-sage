<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";
    import { db } from "$lib/data"

    let { game } = $props()

    let thumbnail = $state(null)
    $effect(() => {
        thumbnail = $db?.cache?.library?.details?.[game.appid]?.data?.thumbnail ?? null
    })

</script>

<!--  -->


<div class="card" role="button" tabindex="0" onclick={() => goto(resolve(`/view?id=${game.appid}`))} onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${game.appid}`))}>
    <div class="display-art">
        {#if thumbnail}
            <img src={thumbnail} alt={game.name} loading="lazy" />
        {:else}
            <div class="card-fallback"></div>
        {/if}
        {#if Math.round((game.playtime_2weeks ?? 0) / 60) > 0}
            <div class="rc-badge">
                <i class="fa-solid fa-fire"></i>
                {Math.round((game.playtime_2weeks ?? 0) / 60)}h this week
            </div>
        {/if}
        <div class="rc-overlay">
            <button
                class="rc-play"
                aria-label="Play {game.name}"
                onclick={(e) => { e.stopPropagation(); window.location.href = `steam://run/${game.appid}` }}
            >
                <i class="fa-solid fa-play"></i>
            </button>
        </div>
    </div>
    <div class="rc-info">
        <div class="rc-name">{game.name}</div>
        <div class="rc-hours">{game.playtime_forever > 0 ? `${Math.round(game.playtime_forever / 60)}h total` : 'Never played'}</div>
    </div>
</div>

<!--  -->

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
        box-shadow: 0 8px 24px hsl(0,0%,0%,0.3);
    }

    .display-art {
        position: relative;
        width: 100%;
        aspect-ratio: 616 / 353;
        overflow: hidden;
        background: var(--l2);
    }

    .display-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .card:hover .display-art img { transform: scale(1.04); }
    .card-fallback { width: 100%; height: 100%; background: var(--l2); }

    .rc-badge {
        position: absolute;
        top: 0.45rem;
        left: 0.45rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.18rem 0.5rem;
        background: hsl(0,0%,0%,0.7);
        border-radius: 100vh;
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--bright-accent);
        backdrop-filter: blur(4px);
    }

    .rc-badge i { font-size: 0.55rem; }

    .rc-overlay {
        position: absolute;
        inset: 0;
        background: hsl(0,0%,0%,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 150ms;
    }

    .card:hover .rc-overlay { opacity: 1; }

    .rc-play {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        color: white;
        cursor: pointer;
        transition: background 120ms, transform 100ms;
    }

    .rc-play:hover { background: var(--bright-accent); transform: scale(1.1); }

    .rc-info {
        padding: 0.65rem 0.85rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .rc-name {
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .rc-hours { font-size: 0.7rem; opacity: 0.45; }
</style>