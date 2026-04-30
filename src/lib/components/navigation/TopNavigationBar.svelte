<script>
	//
	// TopNavigationBar.svelte
	//
	// GameSage
	// written by Aaron Meche
	//

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
    import TopNavigationLink from '$lib/components/navigation/TopNavigationLink.svelte';

	let { setupLocked = false } = $props()
	let dashboardHref = $derived(resolve(setupLocked ? '/profile' : '/dashboard'))

	function openDashboard(event) {
		event.preventDefault()
		goto(dashboardHref)
	}
</script>

<nav class="navbar">
	<a href={dashboardHref} class="logo" onclick={openDashboard}>
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-links">
		{#if !setupLocked}
			<TopNavigationLink route="dashboard" icon="square-poll-vertical" text="Dashboard" />
			<TopNavigationLink route="library"   icon="grip"                 text="Library"   />
			<TopNavigationLink route="activity"  icon="star"                 text="Activity"  />
			<TopNavigationLink route="search"    icon="magnifying-glass"     text="Search"    />
		{/if}
		<TopNavigationLink route="profile"   icon="user"     		 	 text="Profile"    />
	</div>
</nav>

<style>
	.navbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 1.15rem;
		font-weight: 700;
		cursor: pointer;
		margin-right: auto;
		letter-spacing: -0.01em;
		opacity: 0.95;
	}

	.logo i { font-size: 1rem; color: var(--bright-accent); }
	.logo:hover { opacity: 1; }

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}
</style>
