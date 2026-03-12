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


</script>

<svelte:head>
	<title>GameSage</title>
	<link rel="icon" href="logo.png" />
	<script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
</svelte:head>

<div class="app">
	<div class="left-navbar">
		<LeftNavbar />
	</div>
	
	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.app{
		display: grid;
		grid-template-columns: 20rem calc(100vw - 20rem);
	}

	.content{
        padding-top: 3.6rem;
        padding-right: 1.2rem;
    }
</style>