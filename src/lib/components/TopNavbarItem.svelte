<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";
	import { page } from '$app/stores';

    let path = $derived($page.url.pathname)

    let { route, icon, text = null, img = null } = $props()

</script>

<!--  -->

<!-- svelte-ignore a11y_consider_explicit_label -->
<a class="navitem {path == "/" + route ? "active" : ""} {text ? "text" : ""}" href={resolve("/" + route)}>
    <!-- <i class="fa-solid fa-{icon} {text ? "pretext" : ""}"></i> -->
	{#if img}
	<img src={img} alt="">
	{/if}
    {text ? text : ""}
</a>

<!--  -->

<style lang="rue">
	.navitem{
		display: flex;
		align-items: center;
		padding: 0.6rem 1.2rem;
		margin-left: 2pt;
		font-weight: 500;
		letter-spacing: 0.25px;
		border-radius: 0.6rem;
		cursor: pointer;

		img{
			height: 1rem;
			margin-right: 0.4rem;
			border-radius: 100vh;
		}

		:hover{
			background: var(--l1);
			outline: solid 1pt var(--l3);
		}
	}

	.navitem.active{
		color: var(--bright-accent);
	}

	i.pretext{
		margin-right: 0.6rem;
	}
</style>