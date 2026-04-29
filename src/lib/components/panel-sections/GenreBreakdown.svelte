<script>
    import { db } from '$lib/data'
    import { buildLibraryGames, buildGenreWeights } from '$lib/suggestions'

    let details   = $derived($db?.cache?.library?.details  ?? {})
    let playtime  = $derived($db?.cache?.library?.playtime ?? {})
    let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

    let genreRows = $derived(() => {
        const games  = buildLibraryGames(details, playtime, blacklist)
        const weights = buildGenreWeights(games)
        const sorted  = [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
        const maxH    = sorted[0]?.[1] ?? 1
        return sorted.map(([genre, hours]) => ({
            genre,
            hours,
            pct: Math.round((hours / maxH) * 100),
        }))
    })
</script>

{#if genreRows().length > 0}
<section class="panel">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-chart-bar"></i>
            Genre Breakdown
        </div>
    </div>
    <div class="genre-list">
        {#each genreRows() as row}
            <div class="genre-row">
                <div class="g-name">{row.genre}</div>
                <div class="g-track">
                    <div class="g-bar" style="width:{row.pct}%"></div>
                </div>
                <div class="g-hours">{row.hours.toLocaleString()}h</div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .genre-list {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .genre-row {
        display: grid;
        grid-template-columns: minmax(8rem, 12rem) 1fr 3.5rem;
        gap: 0.65rem;
        align-items: center;
    }

    .g-name {
        font-size: 0.82rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .g-track {
        height: 5px;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .g-bar {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        opacity: 0.8;
        transition: width 600ms ease;
    }

    .g-hours {
        font-size: 0.78rem;
        font-weight: 700;
        opacity: 0.55;
        text-align: right;
        white-space: nowrap;
    }
</style>
