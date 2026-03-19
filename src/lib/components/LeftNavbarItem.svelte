<script>
    import { resolve } from "$app/paths";
    import { page } from '$app/stores';


    let { icon, route, label } = $props()

    let curr_path = $derived($page.url.pathname)

</script>

<!--  -->

<a class="{curr_path == route ? "active": ""}" href={resolve(route)}>
    <div class="icon">
        <i class="fa-solid fa-{icon}"></i>
    </div>
    {label}
</a>

<!--  -->

<style lang="rue">
    a{
		display: grid;
		grid-template-columns: min-content auto;
		padding: 0.8rem 0.6rem;
		cursor: pointer;
		border-radius: 0.5rem;
		opacity: 0.75;

		:hover{
			background: var(--l1);
			outline: solid 1pt var(--l3);
			opacity: 1;
		}
	}

    a.active{
        outline: solid 1pt var(--l3);
        opacity: 1;
    }

	.icon{
		display: inline-block;
		width: 2.5rem;
		text-align: center;
	}
</style>