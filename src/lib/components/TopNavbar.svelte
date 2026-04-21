<script>
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { db } from '$lib/data'
    import TopNavbarItem from '$lib/components/TopNavbarItem.svelte';

	let profilepic   = $derived($db?.cache?.user?.data?.avatarfull ?? $db?.user?.photoURL ?? null)
	let personaname  = $derived($db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? null)
	let path         = $derived(page.url.pathname)
</script>

<nav class="navbar">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-links">
		<TopNavbarItem route="dashboard" icon="square-poll-vertical" text="Dashboard" />
		<TopNavbarItem route="library"   icon="grip"                 text="Library"   />
		<TopNavbarItem route="suggest"   icon="wand-magic-sparkles"  text="Suggested" />
		<TopNavbarItem route="reviews"   icon="star"                 text="Activity"  />
	</div>

	<a href={resolve("/profile")} class="profile-btn {path === '/profile' ? 'active' : ''}">
		{#if profilepic}
			<img src={profilepic} alt="" class="profile-img" />
		{:else}
			<div class="profile-icon"><i class="fa-solid fa-user"></i></div>
		{/if}
		{#if personaname}
			<span>{personaname}</span>
		{/if}
	</a>
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

	.profile-btn {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.35rem 0.7rem 0.35rem 0.35rem;
		margin-left: 0.5rem;
		border-radius: 100vh;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		transition: background 150ms;
		outline: solid 1pt transparent;
	}

	.profile-btn:hover {
		background: var(--l1);
		outline-color: var(--l3);
	}

	.profile-btn.active {
		background: var(--la1);
		outline-color: var(--la3);
		color: var(--bright-accent);
	}

	.profile-img {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-icon {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		background: var(--l3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
	}
</style>
