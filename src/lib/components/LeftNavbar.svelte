<script>
    import { resolve } from '$app/paths';
    import { db } from '$lib/data'
    import LeftNavbarItem from './LeftNavbarItem.svelte';

	function formatNumber(num) {
        if (!num) return 0
        return num.toLocaleString('en-US')
    }

	

</script>

<!--  -->

<div class="wrapper">
	<a href={resolve("/")} class="logo">
		<i class="fa-solid fa-hat-wizard"></i>
		GameSage
	</a>

	<div class="nav-buttons">
		<LeftNavbarItem icon="home" route="/" label="Home" />
		<LeftNavbarItem icon="grip" route="/library" label="Library" />
		<LeftNavbarItem icon="user-group" route="/activity" label="Activity" />
		<LeftNavbarItem icon="wand-magic-sparkles" route="/suggest" label="Suggestions" />
		<LeftNavbarItem icon="star" route="/reviews" label="Reviews" />
		<LeftNavbarItem icon="gears" route="/settings" label="Settings" />
	</div>
</div>

<!--  -->

<style>
	.wrapper{
		position: sticky;
		top: 0;
	}
    .logo{
		display: flex;
		align-items: center;
		padding: 2rem;
		font-size: 1.6rem;
		font-weight: 600;
		cursor: pointer;
	}

	.logo i{
		margin-right: 0.5rem;
	}

	.nav-buttons{
		padding: 0 1rem;
	}
</style>