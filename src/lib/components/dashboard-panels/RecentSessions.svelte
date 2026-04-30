<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'

    let recent   = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let details  = $derived($db?.cache?.library?.details     ?? {})
    let playtime = $derived($db?.cache?.library?.playtime    ?? {})

    let sessions = $derived(() => {
        if (!recent.length) return []
        const maxWeek = Math.max(...recent.map(g => g.playtime_2weeks ?? 0), 1)
        return recent.slice(0, 5).map(g => {
            const cached    = details[g.appid]?.data ?? null
            const totalMins = playtime[g.appid] ?? g.playtime_forever ?? 0
            const weekMins  = g.playtime_2weeks ?? 0
            return {
                appid:      g.appid,
                name:       g.name,
                thumbnail:  cached?.thumbnail ?? null,
                genres:     (cached?.genres ?? []).slice(0, 2).map(x => x.description),
                weekHours:  Math.round(weekMins  / 60),
                totalHours: Math.round(totalMins / 60),
                pct:        Math.round((weekMins / maxWeek) * 100),
            }
        })
    })
</script>

{#if sessions().length > 0}
<section class="panel">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-clock-rotate-left"></i>
            Recent Sessions
        </div>
    </div>
    <div class="session-list">
        {#each sessions() as g (g.appid)}
            <div
                class="session-row"
                role="button"
                tabindex="0"
                onclick={() => goto(resolve(`/view?id=${g.appid}`))}
                onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.appid}`))}
            >
                <div class="s-art">
                    {#if g.thumbnail}
                        <img src={g.thumbnail} alt={g.name} loading="lazy" />
                    {:else}
                        <div class="s-art-fallback"></div>
                    {/if}
                </div>
                <div class="s-info">
                    <div class="s-name">{g.name}</div>
                    {#if g.totalHours > 0}
                        <div class="s-total">{g.totalHours.toLocaleString()}h total</div>
                    {/if}
                    <div class="s-bar-wrap">
                        <div class="s-bar" style="width:{g.pct}%"></div>
                    </div>
                </div>
                <div class="s-stats">
                    <div class="s-hrs">{g.weekHours}<span class="s-unit">h</span></div>
                    <div class="s-eyebrow">THIS WEEK</div>
                </div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .session-list { display: flex; flex-direction: column; gap: 0.15rem; }

    .session-row {
        display: grid;
        grid-template-columns: 6rem 1fr auto;
        gap: 0.85rem;
        align-items: center;
        padding: 0.6rem 0.85rem 0.6rem 0.5rem;
        border-radius: 0.7rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .session-row:hover { background: var(--l1); }

    .s-art {
        width: 6rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.45rem;
        overflow: hidden;
        background: var(--l2);
        flex-shrink: 0;
    }

    .s-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .s-art-fallback { width: 100%; height: 100%; background: var(--l3); }

    .s-info {
        display: flex;
        flex-direction: column;
        gap: 0.32rem;
        min-width: 0;
    }

    .s-name {
        font-size: 0.92rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .s-bar-wrap {
        height: 5px;
        background: var(--l3);
        border-radius: 100vh;
        overflow: hidden;
        margin-top: 0.05rem;
    }

    .s-bar {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        transition: width 600ms ease;
    }

    .s-stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.35rem;
        flex-shrink: 0;
        min-width: 4rem;
    }

    .s-eyebrow {
        font-size: 0.58rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.35;
    }

    .s-hrs {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: 0.01em;
        color: var(--bright-accent);
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .s-unit {
        font-size: 1.1rem;
        font-weight: 700;
        opacity: 0.7;
        letter-spacing: 0;
    }

    .s-total {
        font-size: 0.68rem;
        opacity: 0.3;
        white-space: nowrap;
    }
</style>
