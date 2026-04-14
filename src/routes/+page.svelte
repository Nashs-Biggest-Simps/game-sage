<script>
    import { resolve } from "$app/paths";
    import { steamAPI } from "$lib/steam";
    import LeftHalf from "$lib/components/Home/LeftHalf.svelte";
    import RightHalf from "$lib/components/Home/RightHalf.svelte";
    import { onMount } from "svelte";
    import { db } from "$lib/data";

</script>


<!--  -->

<div class="page">
    <LeftHalf />
    <RightHalf />
</div>

<!--  -->

<style>
    .page {
        display: grid;
        grid-template-columns: 3fr 2fr;
    }
</style>
