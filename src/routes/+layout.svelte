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
		{ id: 'a', size: 66, x: 5,  y: 4,  driftX: 28, driftY: 22, scale: 1.04, hue: 210, sat: 78, light: 50, alpha: 0.24, blur: 72, duration: 38, delay: -12 },
		{ id: 'b', size: 58, x: 80, y: 12, driftX: 24, driftY: 30, scale: 0.94, hue: 188, sat: 76, light: 48, alpha: 0.18, blur: 76, duration: 46, delay: -26 },
		{ id: 'c', size: 76, x: 36, y: 52, driftX: 32, driftY: 24, scale: 1.08, hue: 238, sat: 74, light: 46, alpha: 0.14, blur: 90, duration: 54, delay: -34 },
		{ id: 'd', size: 52, x: 4,  y: 76, driftX: 30, driftY: 20, scale: 0.9,  hue: 220, sat: 76, light: 44, alpha: 0.16, blur: 82, duration: 48, delay: -18 },
		{ id: 'e', size: 62, x: 82, y: 70, driftX: 22, driftY: 28, scale: 0.98, hue: 266, sat: 66, light: 44, alpha: 0.12, blur: 90, duration: 58, delay: -42 },
		{ id: 'f', size: 46, x: 56, y: 2,  driftX: 20, driftY: 24, scale: 0.86, hue: 198, sat: 72, light: 48, alpha: 0.13, blur: 78, duration: 44, delay: -28 },
		{ id: 'g', size: 42, x: 30, y: 16, driftX: 18, driftY: 18, scale: 0.82, hue: 316, sat: 58, light: 46, alpha: 0.055, blur: 84, duration: 52, delay: -22 },
		{ id: 'h', size: 50, x: 68, y: 38, driftX: 18, driftY: 24, scale: 0.92, hue: 176, sat: 74, light: 46, alpha: 0.09, blur: 86, duration: 62, delay: -46 }
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
			radial-gradient(circle at 12% 4rem, hsl(210, 76%, 46%, 0.16), transparent 36rem),
			radial-gradient(circle at 88% 12rem, hsl(188, 76%, 45%, 0.1), transparent 36rem),
			radial-gradient(circle at 50% 46rem, hsl(232, 62%, 42%, 0.075), transparent 48rem),
			radial-gradient(circle at 76% 54rem, hsl(266, 62%, 42%, 0.06), transparent 44rem),
			radial-gradient(circle at 24% 28rem, hsl(176, 72%, 42%, 0.055), transparent 34rem),
			linear-gradient(145deg, hsl(212, 28%, 5%) 0%, var(--bg) 34%, hsl(214, 26%, 5%) 100%);
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
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.62) 0%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.34) 28%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.14) 56%,
				hsl(var(--orb-hue), var(--orb-sat), var(--orb-light), 0.045) 78%,
				transparent 100%
			);
		filter: blur(var(--orb-blur)) saturate(1.08);
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
				radial-gradient(ellipse at 72% 18rem, hsl(214, 82%, 58%, 0.1), transparent 32rem),
				radial-gradient(ellipse at 20% 42rem, hsl(188, 76%, 46%, 0.06), transparent 34rem),
				radial-gradient(ellipse at 64% 66rem, hsl(238, 64%, 42%, 0.05), transparent 40rem),
				radial-gradient(ellipse at 84% 48rem, hsl(282, 58%, 42%, 0.04), transparent 34rem),
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
			linear-gradient(to bottom, hsl(212, 28%, 5%, 0.12) 0%, hsl(212, 30%, 5%, 0.34) 55%, hsl(212, 30%, 5%, 0.58) 100%);
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
