<script>
	//
	// LeftNavbar.svelte
	// 
	// GameSage
	// written by Aaron Meche
	//

	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { db } from '$lib/data'
    import LeftNavbarItem from '$lib/components/LeftNavbarItem.svelte';
</script>

<nav class="navbar">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-links">
		<LeftNavbarItem route="dashboard" icon="square-poll-vertical" text="Dashboard" />
		<LeftNavbarItem route="library"   icon="grip"                 text="Library"   />
		<LeftNavbarItem route="activity"  icon="star"                 text="Activity"  />
		<LeftNavbarItem route="search"    icon="magnifying-glass"     text="Search"    />
		<LeftNavbarItem route="profile"   icon="user"     		 	 text="Profile"    />
	</div>
</nav>

<style>
	.logo {
		display: flex;
		align-items: center;
		padding: 1.8rem;
		font-size: 1.6rem;
		gap: 0.8rem;
		font-weight: 700;
		cursor: pointer;
	}

	.logo i { color: var(--bright-accent); }
	.logo:hover { opacity: 1; }

	.nav-links {
		display: grid;
		padding: 0 0.8rem;
		gap: 0.1rem;
	}
</style>
