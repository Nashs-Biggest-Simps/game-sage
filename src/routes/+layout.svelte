<script>
	import "$lib/main.css"
	import "$lib/main.rue"
	import TopNavbar from '$lib/components/TopNavbar.svelte'
	import { onMount } from 'svelte'
	import { startCacheUpdateCycle } from '$lib/cache'
	import { authReady } from '$lib/auth'
	import { db } from '$lib/data'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	let { children } = $props()

	const PUBLIC = ['/', '/login']

	let path             = $derived(page.url.pathname)
	let isAuthed         = $derived(!!$db?.user?.uid)
	let hasSteamID       = $derived(!!$db?.steamID)
	let showSteamBanner  = $derived(isAuthed && !hasSteamID && !PUBLIC.includes(path) && path !== '/profile')

	$effect(() => {
		if ($authReady && !isAuthed && !PUBLIC.includes(path)) {
			goto(resolve('/login'))
		}
	})

	onMount(startCacheUpdateCycle)
</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div class="app">
	<div class="background"></div>

	{#if isAuthed}
		<div class="top-navbar">
			<TopNavbar />
		</div>
	{/if}

	{#if showSteamBanner}
		<div class="steam-banner">
			<i class="fa-solid fa-triangle-exclamation"></i>
			<span>No Steam ID linked — <a href={resolve('/profile')}>add it in your profile</a> to unlock your library and suggestions.</span>
		</div>
	{/if}

	<div class="content {!isAuthed ? 'full' : ''}">
		{@render children()}
	</div>
</div>

<style>
	.background {
		position: fixed;
		inset: 0;
		z-index: -100;
		background: linear-gradient(to bottom, transparent, var(--l05));
		background: var(--bg);
	}

	.top-navbar {
		padding-inline: var(--inline-moat);
		background: var(--l05);
		border-bottom: 1pt solid var(--l2);
	}

	.steam-banner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.65rem var(--inline-moat);
		background: hsl(38, 55%, 12%);
		border-bottom: 1pt solid hsl(38, 55%, 26%);
		font-size: 0.82rem;
		color: hsl(38, 80%, 68%);
	}

	.steam-banner i { flex-shrink: 0; font-size: 0.78rem; }

	.steam-banner a {
		display: inline;
		color: hsl(38, 90%, 78%);
		text-decoration: underline;
		cursor: pointer;
	}

	.content {
		padding-block: 2.4rem;
		padding-inline: var(--inline-moat);
	}

	.content.full {
		padding: 0;
	}
</style>
