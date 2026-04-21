<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";
	import { page } from '$app/state'

    let path = $derived(page.url.pathname)
    let { route, icon, text = null } = $props()
    let active = $derived(path === '/' + route)
</script>

<a class="navitem {active ? 'active' : ''}" href={resolve('/' + route)}>
    <i class="fa-solid fa-{icon}"></i>
    {#if text}<span>{text}</span>{/if}
</a>

<style>
	.navitem {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 120ms, color 120ms;
		opacity: 0.65;
	}

	.navitem i { font-size: 0.8rem; }

	.navitem:hover {
		background: var(--l1);
		opacity: 1;
	}

	.navitem.active {
		color: var(--bright-accent);
		opacity: 1;
		background: var(--la1);
	}
</style>
