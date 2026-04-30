<script>
    let {
        librarySize = 0,
        playedCount = 0,
        totalHours = 0,
        mostPlayedGame = null,
    } = $props()
</script>

{#if librarySize > 0}
    <section class="panel panel-lg stats-panel">
        <h3 class="panel-subheading">
            <i class="fa-solid fa-chart-bar"></i>
            Library Stats
        </h3>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-num">{librarySize.toLocaleString()}</div>
                <div class="stat-lbl">Games Owned</div>
            </div>
            <div class="stat-box accent">
                <div class="stat-num">{playedCount.toLocaleString()}</div>
                <div class="stat-lbl">Games Played</div>
            </div>
            <div class="stat-box">
                <div class="stat-num">{totalHours >= 1000 ? `${(totalHours / 1000).toFixed(1)}k` : totalHours.toLocaleString()}</div>
                <div class="stat-lbl">Total Hours</div>
            </div>
            <div class="stat-box dim">
                <div class="stat-num">{librarySize - playedCount}</div>
                <div class="stat-lbl">Never Played</div>
            </div>
        </div>
        {#if mostPlayedGame}
            <div class="top-game-row">
                <i class="fa-solid fa-trophy"></i>
                Most played: <strong>{mostPlayedGame.name}</strong>
                <span class="muted">— {mostPlayedGame.hours.toLocaleString()}h</span>
            </div>
        {/if}
    </section>
{/if}

<style>
    .stats-panel { gap: 1rem; }

    .panel-subheading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.5;
        margin: 0;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.8rem;
    }

    .stat-box {
        background: var(--l1);
        border-radius: 0.75rem;
        outline: solid 1pt var(--l3);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .stat-box.accent { background: var(--la1); outline-color: var(--la3); }
    .stat-box.dim .stat-num { opacity: 0.45; }
    .stat-num { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
    .stat-box.accent .stat-num { color: var(--bright-accent); }
    .stat-lbl { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.45; margin-top: 0.15rem; }

    .top-game-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        opacity: 0.65;
        flex-wrap: wrap;
    }

    .top-game-row i { color: var(--bright-accent); font-size: 0.75rem; }
    .top-game-row strong { font-weight: 700; opacity: 1; color: inherit; }
    .muted { opacity: 0.45; }

    @media (max-width: 640px) {
        .stats-grid { grid-template-columns: minmax(0, 1fr); }
    }
</style>
