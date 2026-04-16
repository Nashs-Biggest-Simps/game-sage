<script>
    import { db } from "$lib/data"
    import FilterStack from "$lib/components/Suggest/FilterStack.svelte";
    import GameGrid from "$lib/components/Suggest/GameGrid.svelte";
    import { app } from "$lib/firebase";
    import CurrentlyPlaying from "$lib/components/Home/CurrentlyPlaying.svelte";

</script>

<!--  -->

<div class='page'>
    <div class="left-side">
        <div class="module">
            <div class="title">Currently Playing</div>
            <CurrentlyPlaying />
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

<style>
    .page{
        display: grid;
        grid-template-columns: 3fr 2fr;
        gap: 1.6rem;
    }

    .right-side{
        display: grid;
        gap: 1.6rem;
    }

    .module{
        background: var(--lb0);
        padding: 1.6rem 0;
        outline: solid 1pt var(--l3);
        border-radius: 0.8rem;
    }

    .module .title{
        padding: 1.6rem;
        padding-top: 0;
        font-size: 1.6rem;
        font-weight: 700;
    }
</style>