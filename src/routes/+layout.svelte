<script>
	import "$lib/main.css"
	import "$lib/main.rue"
	import TopNavbar from '$lib/components/TopNavbar.svelte';
	import { onMount } from 'svelte';
	import { startCacheUpdateCycle } from '$lib/cache';
	let { children } = $props();

	onMount(startCacheUpdateCycle)
</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div class="app">
	<div class="background">
		<div class="bottom-right-shine"></div>
		<div class="left-side-shine"></div>
	</div>

	<div class="top-navbar">
		<TopNavbar />
	</div>
	
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.background{
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 100vw;
		z-index: -100;
		background: linear-gradient(to bottom, transparent, var(--l05));
	}

	.bottom-right-shine{
		position: absolute;
		height: 100%;
		width: 100%;
		background: linear-gradient(to bottom right, transparent, var(--l2));
		opacity: 0.2;
		display: none;
	}

	.left-side-shine{
		position: absolute;
		height: 100%;
		width: 100%;
		background: linear-gradient(to top right, var(--l2), transparent);
		opacity: 0.2;
		display: none;
	}

	.top-navbar {
		padding-inline: var(--inline-moat);
		background: var(--l05);
		border-bottom: 1pt solid var(--l2);
	}


	.content{
		padding-block: 2.4rem;
		padding-inline: var(--inline-moat);
	}

</style>