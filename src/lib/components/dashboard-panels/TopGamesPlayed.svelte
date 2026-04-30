<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'

    let { compact = false } = $props()
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let details  = $derived($db?.cache?.library?.details  ?? {})

    let topGames = $derived(() => {
        const entries = Object.entries(playtime)
            .filter(([id, mins]) => mins > 0 && details[id]?.data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, mins]) => ({
                appid:  parseInt(id),
                hours:  Math.round(mins / 60),
                detail: details[id].data,
            }))
        const maxHours = entries[0]?.hours ?? 1
        return entries.map(g => ({ ...g, pct: Math.round((g.hours / maxHours) * 100) }))
    })
</script>

{#if topGames().length > 0}
<section class:compact class="panel">
    {#if compact}
        <div class="panel-title">
            <i class="fa-solid fa-trophy"></i>
            Top Games Played
        </div>
    {:else}
        <div class="row-header">
            <div class="row-title">Top Games Played</div>
        </div>
    {/if}
    <div class="top-list">
        {#each topGames() as game, i}
            <div
                class="top-row"
                role="button"
                tabindex="0"
                onclick={() => goto(resolve(`/view?id=${game.appid}`))}
                onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${game.appid}`))}
            >
                <div class="rank">{i + 1}</div>
                <div class="top-art">
                    {#if game?.detail?.thumbnail}
                        <img src={game.detail.thumbnail} alt={game.detail.name} loading="lazy" />
                    {:else}
                        <div class="top-art-fallback"></div>
                    {/if}
                </div>
                <div class="top-info">
                    <div class="top-name">{game.detail.name}</div>
                    {#if game.detail.genres?.length}
                        <div class="top-genres">
                            {#each game.detail.genres.slice(0, 2) as g}
                                <span class="top-genre">{g.description}</span>
                            {/each}
                        </div>
                    {/if}
                    <div class="top-bar-wrap">
                        <div class="top-bar" style="width:{game.pct}%"></div>
                    </div>
                </div>
                <div class="top-stat">
                    <div class="top-hrs">{game.hours.toLocaleString()}<span class="top-unit">h</span></div>
                    <div class="top-eyebrow">TOTAL</div>
                </div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .top-list { display: flex; flex-direction: column; gap: 0.2rem; }

    .top-row {
        display: grid;
        grid-template-columns: 1.6rem 5rem 1fr auto;
        gap: 0.85rem;
        align-items: center;
        padding: 0.55rem 0.85rem 0.55rem 0.5rem;
        border-radius: 0.7rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .top-row:hover { background: var(--l1); }

    .rank {
        font-size: 0.72rem;
        font-weight: 700;
        text-align: center;
        opacity: 0.35;
        font-variant-numeric: tabular-nums;
    }

    .top-row:nth-child(1) .rank { color: var(--bright-accent); opacity: 0.9; }
    .top-row:nth-child(2) .rank { opacity: 0.6; }
    .top-row:nth-child(3) .rank { opacity: 0.45; }

    .top-art {
        width: 5rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.4rem;
        overflow: hidden;
        background: var(--l2);
        flex-shrink: 0;
    }

    .top-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .top-art-fallback { width: 100%; height: 100%; background: var(--l3); }

    .top-info { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }

    .top-name {
        font-size: 0.9rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .top-genres { display: flex; gap: 0.3rem; flex-wrap: wrap; }

    .top-genre {
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.1rem 0.4rem;
        background: var(--l2);
        border-radius: 100vh;
        opacity: 0.7;
        white-space: nowrap;
    }

    .top-bar-wrap {
        height: 5px;
        background: var(--l3);
        border-radius: 100vh;
        overflow: hidden;
    }

    .top-bar {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        transition: width 600ms ease;
    }

    .top-stat {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.35rem;
        flex-shrink: 0;
        min-width: 3.5rem;
    }

    .top-hrs {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: 0.01em;
        color: var(--bright-accent);
        line-height: 1;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .top-unit {
        font-size: 1.1rem;
        font-weight: 700;
        opacity: 0.7;
        letter-spacing: 0;
    }

    .top-eyebrow {
        font-size: 0.58rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.35;
    }

    .compact .top-row {
        grid-template-columns: 1.2rem minmax(0, 1fr) auto;
        gap: 0.55rem;
        padding: 0.5rem;
    }

    .compact .top-art,
    .compact .top-genres,
    .compact .top-bar-wrap,
    .compact .top-eyebrow {
        display: none;
    }

    .compact .top-name {
        font-size: 0.82rem;
    }

    .compact .top-stat {
        min-width: 2.8rem;
    }

    .compact .top-hrs {
        font-size: 1rem;
    }

    .compact .top-unit {
        font-size: 0.72rem;
    }
</style>
