<script>
	import "$lib/main.css"
	import "$lib/main.rue"
	import TopNavbar from '$lib/components/TopNavbar.svelte';
	import LeftNavbar from '$lib/components/LeftNavbar.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db, serverAPI } from '$lib/data'
    import { steamAPI, steamID } from "$lib/steam";
	let { children } = $props();

	// Regular Update Cycle
	// ... cache management, 
	// ... other updates ...
	function regularUpdateCycle() {
		db.update(data => {
			let libraryAppIdArray = data?.cache?.libraryAppIdArray || []
			// Missing User Object
			if (Object.keys(data.user).length < 1) {
				console.log("Fetching playerSummary")
				serverAPI.get("playerSummary/" + steamID, (res => {
					db.update(data => {
						data.user = res.response.players[0]
						return data
					})
				}))
			}
			// No Saved LibraryAppIdArray
			if (!data?.cache?.libraryAppIdArray) {
				console.log("Fetching ownedGames")
				serverAPI.get("ownedGames/" + steamID, res => {
					data.cache.libraryAppIdArray = res?.response?.games.map(i => i.appid) || []
				})
			}
			// Check for missing Library object
			if (!data?.cache?.library) data.cache.library = {}
			// Check for missing Library Cache content
			if (Object.keys(data?.cache?.library) < libraryAppIdArray.length) {
				for (let i = 0; i < libraryAppIdArray.length; i++) {
					let appID = libraryAppIdArray[i]
					if (!data.cache.library?.[appID]) {
						serverAPI.get("gameDetails/" + appID, res => {
							data.cache.library[appID] = res?.[appID]?.data
						})
					}
				}
			}
			console.log("cache", data.cache)
			return data
		})
	}

	onMount(regularUpdateCycle)

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

	.top-navbar{ 
		padding-inline: var(--inline-moat);
		background: linear-gradient(to top right, var(--la1), var(--la05));
	}


	.content{
		padding-block: 2.4rem;
		padding-inline: var(--inline-moat);
	}

</style>