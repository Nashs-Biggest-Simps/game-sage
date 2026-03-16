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




</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
	<meta name='impact-site-verification' value='d1575fe7-a813-4dfd-9b87-47ec3fcc7e89'>
</svelte:head>

<div class="app">
	<div class="top-navbar">
		<TopNavbar />
	</div>
	
	<div class="content">
		{@render children()}
	</div>
</div>

<style>

	.top-navbar{ 
		padding-inline: var(--inline-moat);
		background: linear-gradient(to top right, var(--l05), transparent);
	}

	.content{
		padding-block: 2.4rem;
		padding-inline: var(--inline-moat);
	}

</style>