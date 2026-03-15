<script>
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { db } from '$lib/data'
    import { beforeUpdate, onMount } from 'svelte';
    import TopNavbarItem from '$lib/components/TopNavbarItem.svelte';


	let personaname = null
	beforeUpdate(() => {
		db.subscribe(data => {
			personaname = data?.user?.personaname
		})
	})
</script>

<!--  -->

<div class="wrapper {personaname ? "visible" : "invisible"}">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-buttons">
		<TopNavbarItem route="library" icon="grip" text="Library"/>
		<TopNavbarItem route="suggest" icon="wand-magic-sparkles" text="Suggested"/>
		<TopNavbarItem route="reviews" icon="star" text="Reviews"/>
		<TopNavbarItem route="profile" icon="user" text={personaname}/>
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
		transition: opacity 200ms cubic-bezier(0.215, 0.610, 0.355, 1);
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

	.visible{ opacity : 1; }
	.invisible{ opacity : 0; }
</style>