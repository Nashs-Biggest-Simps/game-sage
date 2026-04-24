<script>
    let {
        icon = 'sparkles',
        title,
        description = null,
        compact = false,
        children,
    } = $props()
</script>

<div class="empty-state" class:compact>
    <div class="icon">
        <i class={`fa-solid fa-${icon}`}></i>
    </div>
    <div class="copy">
        <strong>{title}</strong>
        {#if description}
            <span>{description}</span>
        {/if}
    </div>
    {@render children?.()}
</div>

<style>
    .empty-state {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.4rem;
        min-height: 9rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px dashed var(--panel-border);
        color: var(--text-muted);
    }

    .empty-state.compact {
        min-height: 0;
        padding: 1rem 1.1rem;
    }

    .icon {
        width: 2.8rem;
        height: 2.8rem;
        display: grid;
        place-items: center;
        border-radius: 0.9rem;
        background: var(--panel-strong);
        color: var(--accent-strong);
        flex-shrink: 0;
    }

    .copy {
        display: grid;
        gap: 0.28rem;
    }

    strong {
        font-size: 0.96rem;
        color: var(--text-primary);
    }

    span {
        font-size: 0.82rem;
        line-height: 1.5;
    }
</style>
