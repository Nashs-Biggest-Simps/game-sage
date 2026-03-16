<script>
    import { db } from "$lib/data"
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import GameGrid from "$lib/components/Suggest/GameGrid.svelte";
    import { app } from "$lib/firebase";

</script>

<!--  -->

<div class='page'>
    <div class="warning">Empty Page</div>
    <div class="title">Trending on Marketplace</div>
</div>

<!--  -->

<style>
    .title{
        margin-top: 1.8rem;
        margin-left: 0.4rem;
        margin-bottom: 0.4rem;
        font-size: 2rem;
        font-weight: 700;
    }
</style>