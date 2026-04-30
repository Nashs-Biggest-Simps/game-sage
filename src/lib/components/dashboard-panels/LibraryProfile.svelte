<script>
    import { db } from '$lib/data'
    import { buildLibraryGames, buildGenreWeights } from '$lib/suggestions'

    let details   = $derived($db?.cache?.library?.details  ?? {})
    let playtime  = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

    let profile = $derived(() => {
        const games      = buildLibraryGames(details, playtime, blacklist)
        const played     = games.filter(g => g.playtime > 0)
        const unplayed   = games.filter(g => g.playtime === 0)
        const totalHours = Math.round(games.reduce((s, g) => s + g.playtime, 0) / 60)
        const pctPlayed  = games.length > 0 ? Math.round((played.length / games.length) * 100) : 0

        const weights   = buildGenreWeights(games)
        const topGenres = [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
        const maxW      = topGenres[0]?.[1] ?? 1

        let archetype = 'Explorer'
        if (pctPlayed >= 80)            archetype = 'Completionist'
        else if (unplayed.length > 400) archetype = 'Collector'
        else if (totalHours > 5000)     archetype = 'Obsessive'
        else if (pctPlayed >= 50)       archetype = 'Adventurer'
        else if (totalHours > 1000)     archetype = 'Veteran'

        return { archetype, totalHours, pctPlayed, played: played.length, topGenres, maxW, total: games.length }
    })

    let show = $derived(profile().total >= 5)
</script>

{#if show}
{@const p = profile()}
<div class="panel">
    <div class="panel-title">
        <i class="fa-solid fa-id-badge"></i>
        Library Profile
    </div>

    <div class="arch-block">
        <div class="arch-name">{p.archetype}</div>
        <div class="arch-sub">{p.totalHours.toLocaleString()}h across {p.played} game{p.played !== 1 ? 's' : ''}</div>
    </div>

    <div class="pct-row">
        <span class="pct-label">Library explored</span>
        <span class="pct-val">{p.pctPlayed}%</span>
    </div>
    <div class="pct-track">
        <div class="pct-bar" style="width:{p.pctPlayed}%"></div>
    </div>

    {#if p.topGenres.length > 0}
        <div class="genre-title">Top Genres</div>
        <div class="genre-rows">
            {#each p.topGenres as [genre, hours]}
                <div class="gr-row">
                    <div class="gr-name">{genre}</div>
                    <div class="gr-track">
                        <div class="gr-bar" style="width:{Math.round((hours / p.maxW) * 100)}%"></div>
                    </div>
                    <div class="gr-h">{hours.toLocaleString()}h</div>
                </div>
            {/each}
        </div>
    {/if}
</div>
{/if}

<style>
    .arch-block {
        background: var(--la1);
        border-radius: 0.75rem;
        padding: 0.85rem 1rem;
        outline: solid 1pt var(--la3);
    }

    .arch-name {
        font-size: 1.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--bright-accent);
        line-height: 1;
    }

    .arch-sub {
        font-size: 0.72rem;
        opacity: 0.55;
        margin-top: 0.2rem;
        font-weight: 500;
    }

    .pct-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
        opacity: 0.55;
    }

    .pct-val { font-weight: 700; opacity: 1; color: var(--bright-accent); }

    .pct-track {
        height: 5px;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .pct-bar {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        transition: width 600ms ease;
    }

    .genre-title {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.4;
    }

    .genre-rows { display: flex; flex-direction: column; gap: 0.45rem; }

    .gr-row {
        display: grid;
        grid-template-columns: 1fr 5.5rem 2.8rem;
        gap: 0.5rem;
        align-items: center;
    }

    .gr-name {
        font-size: 0.82rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .gr-track {
        height: 5px;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .gr-bar {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        opacity: 0.75;
        transition: width 600ms ease;
    }

    .gr-h {
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.55;
        text-align: right;
        white-space: nowrap;
    }
</style>
