<script>
    import { db } from '$lib/data'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'

    let game = $derived($db?.cache?.recentlyPlayed?.data?.[0] ?? null)
    let heroUrl  = $derived(game ? `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_hero.jpg` : null)
    let hours    = $derived(game ? Math.round(game.playtime_forever / 60) : 0)
    let recentHours = $derived(game ? Math.round((game.playtime_2weeks || 0) / 60) : 0)

    function launch(e) {
        e.stopPropagation()
        window.location.href = `steam://run/${game.appid}`
    }
</script>

{#if game}
<div
    class="hero"
    style="background-image: url('{heroUrl}')"
    role="button"
    tabindex="0"
    onclick={() => goto(resolve(`/view?id=${game.appid}`))}
    onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${game.appid}`))}
>
    <div class="gradient"></div>
    <div class="content">
        <div class="eyebrow">
            <i class="fa-solid fa-circle-play"></i>
            Continue Playing
        </div>
        <div class="name">{game.name}</div>
        <div class="meta">
            {hours.toLocaleString()}h total
            {#if recentHours > 0}&nbsp;·&nbsp;{recentHours}h this week{/if}
        </div>
        <div class="actions">
            <button class="btn-play" onclick={launch}>
                <i class="fa-solid fa-play"></i>
                Play
            </button>
            <button class="btn-details" onclick={(e) => { e.stopPropagation(); goto(resolve(`/view?id=${game.appid}`)) }}>
                Details
            </button>
        </div>
    </div>
</div>
{:else}
<div class="empty">
    <i class="fa-solid fa-gamepad"></i>
    <span>No recent activity — start playing to see your history here</span>
</div>
{/if}

<style>
    .hero {
        position: relative;
        height: 28rem;
        border-radius: 1.2rem;
        overflow: hidden;
        background-size: cover;
        background-position: center top;
        background-color: var(--l2);
        cursor: pointer;
        transition: box-shadow 200ms;
    }

    .hero:hover { box-shadow: 0 0 0 2px var(--accent); }

    .gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to right,
            hsl(0, 0%, 0%, 0.85) 0%,
            hsl(0, 0%, 0%, 0.5) 50%,
            transparent 100%
        );
        pointer-events: none;
    }

    .content {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 2.2rem 2.4rem;
        gap: 0.5rem;
    }

    .eyebrow {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--bright-accent);
        opacity: 0.9;
    }

    .name {
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1.05;
        text-shadow: 0 2px 12px hsl(0, 0%, 0%, 0.7);
        max-width: 70%;
    }

    .meta {
        font-size: 0.88rem;
        opacity: 0.65;
        margin-bottom: 0.4rem;
    }

    .actions {
        display: flex;
        gap: 0.7rem;
        align-items: center;
    }

    .btn-play {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.65rem 1.6rem;
        font-size: 0.95rem;
        font-weight: 700;
        background: var(--accent);
        border-radius: 0.6rem;
        cursor: pointer;
        transition: background 150ms, transform 100ms;
        color: white;
    }

    .btn-play:hover {
        background: var(--bright-accent);
        transform: scale(1.02);
    }

    .btn-details {
        padding: 0.65rem 1.2rem;
        font-size: 0.88rem;
        font-weight: 600;
        background: hsl(0, 0%, 100%, 0.12);
        border-radius: 0.6rem;
        cursor: pointer;
        transition: background 150ms;
        backdrop-filter: blur(6px);
        color: white;
    }

    .btn-details:hover { background: hsl(0, 0%, 100%, 0.22); }

    .empty {
        height: 10rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background: var(--l1);
        border-radius: 1.2rem;
        font-size: 0.88rem;
        opacity: 0.4;
    }

    .empty i { font-size: 1.6rem; }
</style>
