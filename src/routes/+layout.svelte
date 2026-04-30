<script>
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
		{ id: 'a', size: 66, x: 5,  y: 4,  driftX: 28, driftY: 22, scale: 1.04, hue: 212, sat: 82, light: 54, alpha: 0.28, blur: 68, duration: 38, delay: -12 },
		{ id: 'b', size: 58, x: 80, y: 12, driftX: 24, driftY: 30, scale: 0.94, hue: 188, sat: 74, light: 50, alpha: 0.22, blur: 72, duration: 46, delay: -26 },
		{ id: 'c', size: 76, x: 36, y: 52, driftX: 32, driftY: 24, scale: 1.08, hue: 265, sat: 70, light: 50, alpha: 0.18, blur: 84, duration: 54, delay: -34 },
		{ id: 'd', size: 52, x: 4,  y: 76, driftX: 30, driftY: 20, scale: 0.9,  hue: 146, sat: 70, light: 46, alpha: 0.18, blur: 76, duration: 48, delay: -18 },
		{ id: 'e', size: 62, x: 82, y: 70, driftX: 22, driftY: 28, scale: 0.98, hue: 204, sat: 68, light: 48, alpha: 0.19, blur: 82, duration: 58, delay: -42 },
		{ id: 'f', size: 46, x: 56, y: 2,  driftX: 20, driftY: 24, scale: 0.86, hue: 38,  sat: 84, light: 54, alpha: 0.14, blur: 70, duration: 44, delay: -28 }
	]

	let path             = $derived(page.url.pathname)
	let isAuthed         = $derived(!!$db?.user?.uid)
	let hasValidSteamID  = $derived(isValidSteamId($db?.steamID))
	let needsSteamSetup  = $derived(isAuthed && !hasValidSteamID)
	let fullWidthMode    = $derived($db?.prefs?.display?.fullWidthMode ?? false)
	let boringBackground = $derived($db?.prefs?.display?.boringBackground ?? false)
	let showSteamBanner  = $derived(needsSteamSetup && !PUBLIC.includes(path) && path !== '/profile')
	let cacheCycleKey    = $derived($authReady && isAuthed ? `${$db?.user?.uid ?? ''}:${$db?.steamID ?? ''}` : '')
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
			`--orb-alpha: ${orb.alpha}`,
			`--orb-blur: ${orb.blur}px`
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
		background:
			radial-gradient(circle at 12% 4rem, hsl(212, 78%, 48%, 0.22), transparent 34rem),
			radial-gradient(circle at 88% 12rem, hsl(188, 78%, 48%, 0.16), transparent 34rem),
			radial-gradient(circle at 50% 46rem, hsl(265, 70%, 56%, 0.1), transparent 46rem),
			linear-gradient(145deg, hsl(212, 31%, 7%) 0%, var(--bg) 38%, hsl(214, 28%, 6%) 100%);
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
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		contain: strict;
	}

	.bg-orb {
		position: absolute;
		top: calc(var(--orb-size) * -0.5);
		left: calc(var(--orb-size) * -0.5);
		width: var(--orb-size);
		aspect-ratio: 1;
		border-radius: 999rem;
		opacity: var(--orb-alpha);
		transform: translate3d(var(--orb-x), var(--orb-y), 0) scale(var(--orb-scale));
		background:
			radial-gradient(
				circle,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.72) 0%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.42) 28%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.2) 56%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.065) 78%,
				transparent 100%
			);
		filter: blur(var(--orb-blur)) saturate(1.22);
		mix-blend-mode: screen;
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

	.app::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 0;
			pointer-events: none;
			background:
				radial-gradient(ellipse at 72% 18rem, hsl(212, 88%, 63%, 0.15), transparent 30rem),
				radial-gradient(ellipse at 20% 42rem, hsl(146, 72%, 48%, 0.09), transparent 32rem),
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
