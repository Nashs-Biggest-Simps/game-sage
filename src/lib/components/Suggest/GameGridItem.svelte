<script>
    import { resolve } from '$app/paths'
    import { db } from '$lib/data'

    let { game } = $props()

    let playtime = $derived($db?.cache?.library?.playtime?.[game?.steam_appid] ?? 0)
    let hours    = $derived(Math.round(playtime / 60))
</script>

{#if game}
<a href={resolve(`/view?id=${game.steam_appid}`)} class="card">
    <div class="thumb-wrap">
        <img
            class="thumb"
            src="https://cdn.akamai.steamstatic.com/steam/apps/{game.steam_appid}/capsule_616x353.jpg"
            alt={game.name}
        />
        <div class="thumb-overlay">
            <button
                class="btn-play"
                onclick={(e) => { e.preventDefault(); window.location.href = `steam://run/${game.steam_appid}` }}
            >
                <i class="fa-solid fa-play"></i>
                Play
            </button>
        </div>
    </div>

    <div class="info">
        <div class="name">{game.name}</div>
        <div class="meta">
            {#if hours > 0}
                {hours.toLocaleString()}h played
            {:else}
                Never played
            {/if}
        </div>
        {#if game.genres?.length}
            <div class="tags">
                {#each game.genres.slice(0, 2) as genre}
                    <span class="tag">{genre.description}</span>
                {/each}
            </div>
        {/if}
    </div>
</a>
{/if}

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

    .thumb-wrap {
        position: relative;
        overflow: hidden;
    }

    .thumb {
        width: 100%;
        display: block;
        aspect-ratio: 616 / 353;
        object-fit: cover;
        transition: transform 180ms;
    }

    .card:hover .thumb { transform: scale(1.04); }

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

    .info {
        padding: 0.75rem 0.85rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .name {
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .meta {
        font-size: 0.75rem;
        opacity: 0.5;
    }

    .tags {
        display: flex;
        gap: 0.35rem;
        margin-top: 0.2rem;
        flex-wrap: wrap;
    }

    .tag {
        font-size: 0.68rem;
        padding: 0.2rem 0.5rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.75;
    }
</style>
