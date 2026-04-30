<script>
    let { value = $bindable('scroll') } = $props()

    let expanded = $derived(value === 'grid')

    function toggle() {
        value = expanded ? 'scroll' : 'grid'
    }
</script>

<button
    type="button"
    class="view-toggle"
    aria-expanded={expanded}
    onclick={toggle}
>
    <span>{expanded ? 'Contract' : 'Expand'}</span>
    <i class="fa-solid fa-chevron-{expanded ? 'up' : 'down'}"></i>
</button>

<style>
    .view-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        min-height: 1.7rem;
        padding: 0.28rem 0.62rem;
        border-radius: 100vh;
        background: hsl(212, 24%, 11%, 0.52);
        outline: solid 1pt hsl(212, 34%, 34%, 0.36);
        color: hsl(212, 18%, 84%, 0.68);
        font-size: 0.68rem;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        backdrop-filter: blur(18px) saturate(1.18);
        -webkit-backdrop-filter: blur(18px) saturate(1.18);
        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.04);
        transition: background 150ms, color 150ms, outline-color 150ms, transform 150ms;
    }

    .view-toggle:hover {
        color: white;
        background: hsl(212, 28%, 18%, 0.62);
        outline-color: hsl(188, 70%, 52%, 0.42);
    }

    .view-toggle:focus-visible {
        outline: solid 2px hsl(188, 82%, 66%, 0.76);
        outline-offset: 2px;
    }

    i {
        font-size: 0.62rem;
    }
</style>
