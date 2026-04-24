<script>
    let {
        padded = true,
        highlight = false,
        dense = false,
        className = '',
        children,
    } = $props()
</script>

<section class={`surface ${className}`} class:padded class:highlight class:dense>
    {@render children?.()}
</section>

<style>
    .surface {
        position: relative;
        background:
            linear-gradient(180deg, hsl(214, 45%, 17%, 0.92), hsl(214, 32%, 12%, 0.94));
        border: 1px solid var(--panel-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--panel-shadow);
        overflow: hidden;
    }

    .surface::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, hsl(0, 0%, 100%, 0.03), transparent 22%);
    }

    .surface.padded {
        padding: 1.25rem;
    }

    .surface.highlight {
        border-color: var(--panel-border-strong);
        box-shadow: 0 24px 60px hsl(219, 70%, 3%, 0.46);
    }

    .surface.dense.padded {
        padding: 1rem;
    }
</style>
