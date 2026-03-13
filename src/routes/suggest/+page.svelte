<script>
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import RecommendGrid from "$lib/components/Suggest/RecommendGrid.svelte";


</script>

<!--  -->

<div class='page'>
    <!-- <div class="warning">This list of games is hardcoded and predetermined.</div> -->
    <div class="filter-stack">
        <FilterStack />
    </div>
    <div class="game-stack">
        <div class="title">Recommended Games</div>
        <RecommendGrid />
    </div>
</div>

<!--  -->

<style>
    .page{
        display: grid;
        grid-template-columns: 1fr 3fr;
    }

    .filter{
        margin-inline: 0.4rem;
        padding: 0.6rem 0.8rem;
        background: var(--l1);
        border-radius: 0.4rem;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .filter:hover{
        background: var(--l2);
        outline: solid 1pt var(--l4);
    }

    .title{
        margin-top: 1.8rem;
        margin-left: 0.4rem;
        margin-bottom: 0.4rem;
        font-size: 2rem;
        font-weight: 700;
    }
</style>