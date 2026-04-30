<script>
	import "$lib/main.css"
	import "$lib/main.rue"
	import TopNavigationBar from '$lib/components/navigation/TopNavigationBar.svelte'
	import { onDestroy, onMount } from 'svelte'
	import { startCacheUpdateCycle } from '$lib/cache'
	import { authReady } from '$lib/auth'
	import { db } from '$lib/data'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	let { children } = $props()

	const PUBLIC = ['/', '/login']
	const loginHref = resolve('/login')
	const profileHref = resolve('/profile')
	const CACHE_UPDATE_INTERVAL_MS = 60_000

	let path             = $derived(page.url.pathname)
	let isAuthed         = $derived(!!$db?.user?.uid)
	let hasSteamID       = $derived(!!$db?.steamID)
	let showSteamBanner  = $derived(isAuthed && !hasSteamID && !PUBLIC.includes(path) && path !== '/profile')
	let cacheCycleKey    = $derived($authReady && isAuthed ? `${$db?.user?.uid ?? ''}:${$db?.steamID ?? ''}` : '')
	let lastCacheCycleKey = $state('')
	let cacheInterval = null

	$effect(() => {
		if ($authReady && !isAuthed && !PUBLIC.includes(path)) {
			goto(loginHref)
		}
	})

	$effect(() => {
		if (!cacheCycleKey || cacheCycleKey === lastCacheCycleKey) return
		lastCacheCycleKey = cacheCycleKey
		startCacheUpdateCycle()
	})

	function navigate(event, href) {
		event.preventDefault()
		goto(href)
	}

	onMount(() => {
		cacheInterval = setInterval(startCacheUpdateCycle, CACHE_UPDATE_INTERVAL_MS)
	})

	onDestroy(() => clearInterval(cacheInterval))
</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div class="app">
	{#if isAuthed}
		<div class="top-navbar">
			<TopNavigationBar />
		</div>
	{/if}

	{#if showSteamBanner}
		<div class="steam-banner">
			<i class="fa-solid fa-triangle-exclamation"></i>
			<span>No Steam ID linked — <a href={profileHref} onclick={(event) => navigate(event, profileHref)}>add it in your profile</a> to unlock your library and suggestions.</span>
		</div>
	{/if}

	{#key path}
		<div class="content">
			{@render children()}
		</div>
	{/key}
</div>

<style>
	.app {
		position: relative;
		isolation: isolate;
		min-height: 100vh;
		background:
			radial-gradient(circle at 10% 6rem, hsl(188, 84%, 48%, 0.2), transparent 25rem),
			radial-gradient(circle at 88% 10rem, hsl(146, 68%, 44%, 0.13), transparent 24rem),
			radial-gradient(circle at 56% 32rem, hsl(218, 80%, 58%, 0.13), transparent 36rem),
			radial-gradient(circle at 18% 58rem, hsl(38, 90%, 52%, 0.08), transparent 30rem),
			radial-gradient(circle at 92% 76rem, hsl(265, 58%, 54%, 0.08), transparent 34rem),
			linear-gradient(145deg, hsl(212, 31%, 7%) 0%, var(--bg) 38%, hsl(214, 28%, 6%) 100%);
	}

	.app::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
			pointer-events: none;
			background:
				radial-gradient(ellipse at 72% 18rem, hsl(212, 88%, 63%, 0.14), transparent 24rem),
				radial-gradient(ellipse at 28% 38rem, hsl(180, 70%, 46%, 0.08), transparent 22rem),
				linear-gradient(115deg, transparent 0%, hsl(0, 0%, 100%, 0.025) 42%, transparent 64%);
			mask-image: linear-gradient(to bottom, black 0%, black 78%, transparent 100%);
			-webkit-mask-image: linear-gradient(to bottom, black 0%, black 78%, transparent 100%);
			opacity: 0.9;
	}

	.app::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background:
			radial-gradient(ellipse at 50% 0%, transparent 0%, hsl(0, 0%, 0%, 0.16) 70%),
			linear-gradient(to bottom, transparent 0%, hsl(212, 30%, 6%, 0.18) 55%, hsl(212, 30%, 6%, 0.42) 100%);
	}

	.app > * {
		position: relative;
		z-index: 1;
	}

	.top-navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		padding-inline: var(--inline-moat);
		background: hsl(212, 26%, 10%, 0.46);
		border-bottom: 1pt solid hsl(212, 38%, 36%, 0.5);
		backdrop-filter: blur(28px) saturate(1.34);
		-webkit-backdrop-filter: blur(28px) saturate(1.34);
		box-shadow:
			0 12px 36px hsl(0, 0%, 0%, 0.22),
			inset 0 1px 0 hsl(0, 0%, 100%, 0.06);
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
</style>
