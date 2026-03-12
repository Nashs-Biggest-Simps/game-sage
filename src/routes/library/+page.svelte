<script>
    import RecommendGrid from "$lib/components/Suggest/RecommendGrid.svelte";



    let items = new Array(30)
</script>

<!--  -->

<div class="page">
    <div class="alert">
        This page was copied from the Suggestions page. This list of games is hardcoded and predetermined.
    </div>
    <div class="horizontal-scroll filter-wrapper">
        <button class="filter">Display: All ▼</button>
        <button class="filter">Genre: All ▼</button>
        <button class="filter">Platform: All ▼</button>
        <button class="filter">Max Playtime: None ▼</button>
        <button class="filter">Max Price: None ▼</button>
        <button class="filter">Sort: Relevance ▼</button>
    </div>
    <div class="title">Your Library</div>
    <RecommendGrid />
</div>

<!--  -->

<style>
    .page{
        width: 100%;
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