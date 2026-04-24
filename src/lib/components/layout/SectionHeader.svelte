<script>
    let {
        title,
        subtitle = null,
        badge = null,
        compact = false,
        children,
    } = $props()
</script>

<header class="section-header" class:compact>
    <div class="copy">
        <div class="title-row">
            <h2>{title}</h2>
            {#if badge}
                <span class="badge">{badge}</span>
            {/if}
        </div>
        {#if subtitle}
            <p>{subtitle}</p>
        {/if}
    </div>

    <div class="actions">
        {@render children?.()}
    </div>
</header>

<style>
    .section-header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .section-header.compact {
        align-items: center;
    }

    .copy {
        display: grid;
        gap: 0.35rem;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        letter-spacing: -0.03em;
    }

    p {
        margin: 0;
        font-size: 0.84rem;
        color: var(--text-muted);
        line-height: 1.55;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.28rem 0.68rem;
        border-radius: 999px;
        background: var(--panel-strong);
        border: 1px solid var(--panel-border-strong);
        color: var(--accent-strong);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
    }
</style>
