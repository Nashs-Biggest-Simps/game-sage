<script>
	//
	// TopNavbarItem.svelte
	//
	// GameSage
	// written by Aaron Meche
	//

    import { resolve } from "$app/paths";
	import { page } from '$app/state'

    let { route, icon, text = null } = $props()
	let active = $state(null)
	let path = $state(null)

	$effect(() => {
		active = path === '/' + route
		path = page.url.pathname
	})
</script>

<!--  -->

<a class="navitem {active ? 'active' : ''}" href={resolve('/' + route)}>
    <i class="fa-solid fa-{icon}"></i>
    {#if text}<span>{text}</span>{/if}
</a>

<!--  -->

<style>
	.navitem {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.8rem 1.2rem;
		border-radius: 0.8rem;
		font-size: 0.9rem;
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
