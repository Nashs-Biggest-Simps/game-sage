<script>
    import { db } from "$lib/data"
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import GameGrid from "$lib/components/Suggest/GameGrid.svelte";
    import { app } from "$lib/firebase";

</script>

<!--  -->

<div class='page'>
    <div class="left-side">
        <div class="module">
            <div class="title">Currently Playing</div>
        </div>

    </div>
    <div class="right-side">
        <div class="module">
            <div class="title">Friend Activity</div>
        </div>
        <div class="module">
            <div class="title">Suggestions</div>
        </div>
    </div>
</div>

<!--  -->

<style lang="rue">
    .page{
        display: grid;
        grid-template-columns: 3fr 2fr;
        gap: 1.2rem;
    }

    .module{
        padding: 1.6rem;
        background: var(--lz0);
        border-radius: 0.8rem;
    }

    .right-side{
        display: grid;
        gap: 1.2rem;
    }
</style>