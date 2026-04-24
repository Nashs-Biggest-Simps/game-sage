<script>
    let {
        eyebrow = null,
        title,
        description = null,
        align = 'left',
        children,
    } = $props()
</script>

<header class="page-header" class:centered={align === 'center'}>
    {#if eyebrow}
        <div class="eyebrow">{eyebrow}</div>
    {/if}

    <div class="copy">
        <h1>{title}</h1>
        {#if description}
            <p>{description}</p>
        {/if}
    </div>

    <div class="actions">
        {@render children?.()}
    </div>
</header>

<style>
    .page-header {
        display: grid;
        gap: 1rem;
        align-items: end;
    }

    .page-header.centered {
        justify-items: center;
        text-align: center;
    }

    .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        width: fit-content;
        padding: 0.38rem 0.72rem;
        border-radius: 999px;
        background: var(--panel-strong);
        border: 1px solid var(--panel-border-strong);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent-strong);
    }

    .copy {
        display: grid;
        gap: 0.65rem;
    }

    h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.6rem);
        line-height: 1.04;
        letter-spacing: -0.04em;
    }

    p {
        max-width: 44rem;
        margin: 0;
        font-size: 1rem;
        line-height: 1.7;
        color: var(--text-muted);
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
    }
</style>
