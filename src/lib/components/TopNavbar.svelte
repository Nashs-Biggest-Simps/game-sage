<script>
	//
	// TopNavbar.svelte
	// 
	// GameSage
	// written by Aaron Meche
	//

	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { db } from '$lib/data'
    import TopNavbarItem from '$lib/components/TopNavbarItem.svelte';

	let name = $state(null)
	let path = $state(null)
	let pfp = $state(null)

	$effect(() => {
		name = $db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? null
		path = page.url.pathname
		pfp = $db?.cache?.user?.data?.avatarfull ?? $db?.user?.photoURL ?? null
	})
</script>

<nav class="navbar">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-links">
		<TopNavbarItem route="dashboard" icon="square-poll-vertical" text="Dashboard" />
		<TopNavbarItem route="library"   icon="grip"                 text="Library"   />
		<TopNavbarItem route="activity"  icon="star"                 text="Activity"  />
		<TopNavbarItem route="search"    icon="magnifying-glass"     text="Search"    />
		<TopNavbarItem route="profile"   icon="user"     		 	 text="Profile"    />
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
