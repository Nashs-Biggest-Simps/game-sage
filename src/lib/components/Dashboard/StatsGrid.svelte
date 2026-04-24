<script>
    let { items = [] } = $props()
</script>

<div class="stats-grid">
    {#each items as item}
        <div class="stat-card" class:highlight={item.highlight}>
            <div class="stat-label">{item.label}</div>
            <div class="stat-value">{item.value}</div>
            {#if item.detail}
                <div class="stat-detail">{item.detail}</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: 0.9rem;
    }

    .stat-card {
        display: grid;
        gap: 0.38rem;
        padding: 1rem 1.05rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .stat-card.highlight {
        background: linear-gradient(180deg, hsl(213, 82%, 56%, 0.16), hsl(213, 30%, 18%, 0.6));
        border-color: var(--panel-border-strong);
    }

    .stat-label {
        color: var(--text-muted);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
    }

    .stat-value {
        font-size: clamp(1.4rem, 2vw, 2rem);
        font-weight: 800;
        letter-spacing: -0.04em;
    }

    .stat-detail {
        color: var(--text-dim);
        font-size: 0.76rem;
        line-height: 1.5;
    }
</style>
