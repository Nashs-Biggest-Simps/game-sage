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
		gap: 0.45rem;
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
			transition: background 120ms, color 120ms, opacity 120ms;
			opacity: 0.72;
	}

	.navitem i { font-size: 0.8rem; }

		.navitem:hover {
			background: hsl(212, 36%, 22%, 0.38);
			color: hsl(0, 0%, 100%, 0.92);
			opacity: 0.92;
		}

		.navitem.active {
			color: hsl(212, 82%, 76%);
			opacity: 0.96;
			background: hsl(212, 40%, 23%, 0.44);
		}
</style>
