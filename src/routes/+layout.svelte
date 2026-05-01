<script>
    // 
    // Layout
    // created by Aaron Meche
    //
	import "$lib/main.css"
	import "$lib/main.rue"
	import TopNavigationBar from '$lib/components/navigation/TopNavigationBar.svelte'
	import { onDestroy, onMount } from 'svelte'
	import { startCacheUpdateCycle } from '$lib/cache'
	import { authReady } from '$lib/auth'
	import { db } from '$lib/data'
	import { isValidSteamId } from '$lib/steam'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	let { children } = $props()

	const PUBLIC = ['/']
	const landingHref = resolve('/')
	const profileHref = resolve('/profile')
	const CACHE_UPDATE_INTERVAL_MS = 60_000
	const BACKGROUND_ORBS = [
		{ id: 'a', size: 72, x: 10, y: 2,  driftX: 22, driftY: 18, scale: 1.04, hue: 210, sat: 78, light: 50, alpha: 0.2,  duration: 34, delay: -12 },
		{ id: 'b', size: 64, x: 76, y: 8,  driftX: 18, driftY: 22, scale: 0.94, hue: 188, sat: 74, light: 48, alpha: 0.14, duration: 42, delay: -24 },
		{ id: 'c', size: 82, x: 34, y: 54, driftX: 24, driftY: 18, scale: 1.08, hue: 234, sat: 70, light: 44, alpha: 0.13, duration: 50, delay: -32 },
		{ id: 'd', size: 66, x: 78, y: 70, driftX: 18, driftY: 20, scale: 0.98, hue: 266, sat: 58, light: 42, alpha: 0.08, duration: 56, delay: -40 },
		{ id: 'e', size: 46, x: 3,  y: 76, driftX: 20, driftY: 14, scale: 0.9,  hue: 176, sat: 70, light: 44, alpha: 0.08, duration: 46, delay: -18 },
	]

	let path = $derived(page.url.pathname)
	// Display Preferences
	let boringBackground = $derived($db?.prefs?.display?.boringBackground ?? false)
	let fullWidthMode = $derived($db?.prefs?.display?.fullWidthMode ?? false)
	// Account Status
	let showSteamBanner = $derived(needsSteamSetup && !PUBLIC.includes(path) && path !== '/profile')
	let hasValidSteamID = $derived(isValidSteamId($db?.steamID))
	let needsSteamSetup = $derived(isAuthed && !hasValidSteamID)
	let isAuthed = $derived(!!$db?.user?.uid)
	// Cache
	let cacheCycleKey = $derived($authReady && isAuthed ? `${$db?.user?.uid ?? ''}:${$db?.steamID ?? ''}` : '')
	let lastCacheCycleKey = $state('')
	let cacheInterval = null

	$effect(() => {
		if ($authReady && !isAuthed && !PUBLIC.includes(path)) {
			goto(landingHref)
		}
	})

	$effect(() => {
		if ($authReady && needsSteamSetup && !PUBLIC.includes(path) && path !== '/profile') {
			goto(profileHref)
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

	function orbStyle(orb) {
		return [
			`--orb-size: ${orb.size}rem`,
			`--orb-x: ${orb.x}vw`,
			`--orb-y: ${orb.y}vh`,
			`--orb-scale: ${orb.scale}`,
			`--orb-scale-low: ${Math.max(0.7, orb.scale - 0.08)}`,
			`--orb-scale-high: ${orb.scale + 0.08}`,
			`--orb-drift-x: ${orb.driftX}vw`,
			`--orb-drift-y: ${orb.driftY}vh`,
			`--orb-mid-x: ${orb.driftX * 0.28}vw`,
			`--orb-mid-y: ${orb.driftY * 0.18}vh`,
			`--orb-duration: ${orb.duration}s`,
			`--orb-delay: ${orb.delay}s`,
			`--orb-hue: ${orb.hue}`,
			`--orb-sat: ${orb.sat}%`,
			`--orb-light: ${orb.light}%`,
			`--orb-alpha: ${orb.alpha}`
		].join(';')
	}

	onMount(() => {
		cacheInterval = setInterval(() => {
			if ($authReady && isAuthed) startCacheUpdateCycle()
		}, CACHE_UPDATE_INTERVAL_MS)
	})

	onDestroy(() => {
		clearInterval(cacheInterval)
	})
</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div
	class="app"
	class:full-width-mode={fullWidthMode}
	class:boring-background={boringBackground}
>
	{#if !boringBackground}
		<div class="dynamic-background" aria-hidden="true">
			{#each BACKGROUND_ORBS as orb (orb.id)}
				<div class="bg-orb orb-{orb.id}" style={orbStyle(orb)}></div>
			{/each}
		</div>
	{/if}

	{#if isAuthed}
		<div class="top-navbar">
			<TopNavigationBar setupLocked={needsSteamSetup} />
		</div>
	{/if}

	{#if showSteamBanner}
		<div class="steam-banner">
			<i class="fa-solid fa-triangle-exclamation"></i>
			<span>Valid Steam ID required — <a href={profileHref} onclick={(event) => navigate(event, profileHref)}>add your 17-digit SteamID64 in your profile</a> to unlock your library and suggestions.</span>
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
		background: var(--bg);
		overflow-x: hidden;
	}

	.app.full-width-mode {
		--inline-moat: 1.2rem;
	}

	.app.boring-background {
		background: var(--bg);
	}

	.app.boring-background::before,
	.app.boring-background::after,
	.app.boring-background .dynamic-background {
		display: none;
	}

	.dynamic-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		contain: layout paint style;
		background:
			radial-gradient(circle at 12% 10%, hsl(210, 76%, 46%, 0.18), transparent 34rem),
			radial-gradient(circle at 88% 18%, hsl(188, 76%, 45%, 0.11), transparent 32rem),
			radial-gradient(circle at 50% 78%, hsl(232, 62%, 42%, 0.08), transparent 44rem),
			linear-gradient(145deg, hsl(212, 28%, 5%) 0%, var(--bg) 42%, hsl(214, 26%, 5%) 100%);
	}

	.bg-orb {
		position: absolute;
		top: calc(var(--orb-size) * -0.5);
		left: calc(var(--orb-size) * -0.5);
		width: var(--orb-size);
		aspect-ratio: 1;
		border-radius: 999rem;
		opacity: var(--orb-alpha);
		background:
			radial-gradient(
				circle,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.58) 0%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.24) 38%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.07) 66%,
				transparent 100%
			);
		will-change: transform;
		animation: orb-drift var(--orb-duration) ease-in-out var(--orb-delay) infinite alternate;
	}

	@keyframes orb-drift {
		0% {
			transform:
				translate3d(
					calc(var(--orb-x) - var(--orb-drift-x)),
					calc(var(--orb-y) - var(--orb-drift-y)),
					0
				)
				scale(var(--orb-scale-low));
		}

		50% {
			transform:
				translate3d(
					calc(var(--orb-x) + var(--orb-mid-x)),
					calc(var(--orb-y) - var(--orb-mid-y)),
					0
				)
				scale(var(--orb-scale-high));
		}

		100% {
			transform:
				translate3d(
					calc(var(--orb-x) + var(--orb-drift-x)),
					calc(var(--orb-y) + var(--orb-drift-y)),
					0
				)
				scale(var(--orb-scale));
		}
	}

	.dynamic-background::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(ellipse at 50% 0%, transparent 0%, hsl(0, 0%, 0%, 0.14) 70%),
			linear-gradient(to bottom, transparent 0%, hsl(212, 30%, 5%, 0.52) 100%);
	}

	.app > * {
		position: relative;
		z-index: 1;
	}

	.app > .dynamic-background {
		position: fixed;
		z-index: 0;
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

	@media (prefers-reduced-motion: reduce) {
		.bg-orb {
			animation: none;
			will-change: auto;
		}
	}
</style>
