<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";
    import LeftHalf from "$lib/components/Home/LeftHalf.svelte";
    import RightHalf from "$lib/components/Home/RightHalf.svelte";


</script>

<!--  -->

<div class="page">
    <LeftHalf />
    <RightHalf />
</div>

<!--  -->

<style>
    .page{
        display: grid;
        grid-template-columns: 3fr 2fr;
    }
</style>
