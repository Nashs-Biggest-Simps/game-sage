<script>
    import { page } from '$app/state'
    import { resolve } from '$app/paths'

    let { href, icon, label } = $props()

    let isActive = $derived(page.url.pathname === href)
</script>

<a class="nav-item" class:active={isActive} href={resolve(href)}>
    <i class={`fa-solid fa-${icon}`}></i>
    <span>{label}</span>
</a>

<style>
    .nav-item {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.56rem 0.9rem;
        border-radius: 999px;
        color: var(--text-muted);
        font-size: 0.86rem;
        font-weight: 600;
        transition: background 160ms, color 160ms, border-color 160ms;
        border: 1px solid transparent;
    }

    .nav-item:hover {
        color: var(--text-primary);
        background: var(--panel-soft);
        border-color: var(--panel-border);
    }

    .nav-item.active {
        color: var(--text-primary);
        background: var(--panel-strong);
        border-color: var(--panel-border-strong);
    }

    i {
        font-size: 0.78rem;
    }
</style>
