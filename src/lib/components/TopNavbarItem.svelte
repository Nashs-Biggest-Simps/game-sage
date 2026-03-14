<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";
	import { page } from '$app/stores';

    let path = $derived($page.url.pathname)

    let { route, icon, text = null } = $props()

</script>

<!--  -->

<!-- svelte-ignore a11y_consider_explicit_label -->
<a class="{path == "/" + route ? "active" : ""} {text ? "text" : ""}" href={resolve("/" + route)}>
    <i class="fa-solid fa-{icon} {text ? "pretext" : ""}"></i>
    {text ? text : ""}
</a>

<!--  -->

<style>
	a{
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2.4rem;
		margin-left: 2pt;
		aspect-ratio: 1 / 1;
		border-radius: 0.6rem;
		cursor: pointer;
	}

	a:hover{
		background: var(--l1);
		outline: solid 1pt var(--l3);
	}

	a.active{
		background: var(--l05);
		color: var(--accent);
		/* outline: solid 1pt var(--l2); */
	}

	a.text{
		padding-inline: 0.8rem;
	}

	i.pretext{
		margin-right: 0.6rem;
	}
</style>