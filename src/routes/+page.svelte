<script>
    import { resolve } from "$app/paths";
    import { steamAPICall } from "$lib/steam";
    import LeftHalf from "$lib/components/Home/LeftHalf.svelte";
    import RightHalf from "$lib/components/Home/RightHalf.svelte";
    import { onMount } from "svelte";
    import { updateUserObject } from "$lib/data";

    const id = "76561199687209554"


    onMount(() => {
        steamAPICall("getRecentlyPlayedGames", id, data => {
            console.log(data)
        })
    })
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
