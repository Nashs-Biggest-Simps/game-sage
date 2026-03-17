<script>
    import { resolve } from "$app/paths";
    import { steamAPI } from "$lib/steam";
    import LeftHalf from "$lib/components/Home/LeftHalf.svelte";
    import RightHalf from "$lib/components/Home/RightHalf.svelte";
    import { onMount } from "svelte";
    import { db, updateUserObject } from "$lib/data";

    const id = "76561199687209554"
    onMount(() => {
        updateUserObject()
    })

</script>


<!--  -->

<div class="page">
    <RightHalf />
    <LeftHalf />
</div>

<!--  -->

<style>
    .page {
        display: grid;
        grid-template-columns: 2fr 3fr;
    }
</style>
