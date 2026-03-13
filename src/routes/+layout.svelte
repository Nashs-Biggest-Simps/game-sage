<script>
	import '$lib/main.css';
	import TopNavbar from '$lib/components/TopNavbar.svelte';
	import LeftNavbar from '$lib/components/LeftNavbar.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/data'
	let { children } = $props();

	onMount(() => {
		
	})

	const leftNavBarBool = false


</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div class="app {leftNavBarBool ? "leftbar" : "topbar"}">
	{#if leftNavBarBool}
		<div class="left-navbar">
			<LeftNavbar />
		</div>
	{:else}
		<div class="top-navbar">
			<TopNavbar />
		</div>
	{/if}
	
	<div class="content">
		{@render children()}
	</div>
</div>

<style>

	.app.leftbar{
		display: grid;
		grid-template-columns: 20rem calc(100vw - 20rem);
	}

	.app.leftbar .content{
        padding-top: 3.6rem;
        padding-right: 1.2rem;
    }

	.app.topbar{
		padding-inline: var(--inline-moat);
	}
</style>