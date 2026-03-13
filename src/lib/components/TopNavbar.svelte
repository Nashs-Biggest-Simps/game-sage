<script>
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { db } from '$lib/data'
    import { onMount } from 'svelte';
    import TopNavbarItem from '$lib/components/TopNavbarItem.svelte';
</script>

<!--  -->

<div class="wrapper">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-buttons">
		<TopNavbarItem route="library" icon="grip" text="Library"/>
		<TopNavbarItem route="suggest" icon="wand-magic-sparkles" text="Suggested"/>
		<TopNavbarItem route="reviews" icon="star" text="Reviews"/>
		<TopNavbarItem route="profile" icon="user" text="nonoobu_8"/>
	</div>
</div>

<!--  -->

<style>
	.wrapper{
		height: 4rem;
		display: grid;
		grid-template-columns: auto min-content;
		align-items: center;
		padding: 1rem 0;
	}
    .logo{
		width: fit-content;
		display: flex;
		align-items: center;
		font-size: 1.6rem;
		font-weight: 600;
		cursor: pointer;
	}

	.logo:hover{
		text-decoration: underline;
	}

	.logo i{
		margin-right: 0.5rem;
	}

	.nav-buttons{
		display: flex;
		align-items: center;
	}
</style>