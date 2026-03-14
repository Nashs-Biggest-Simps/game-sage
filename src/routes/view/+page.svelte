<script>
    import { page } from '$app/stores';
    import { getGameDetails } from '$lib/steam'

    let appid = null
    let name = null
    let game = null
    $: {
        appid = $page.url.searchParams.get('id')
        name = $page.url.searchParams.get('name')
        game = getGameDetails(appid)
    }
</script>

<!--  -->

<div class='page'>
    <div class="game-title">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button onclick={() => history.back()}>
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        {name}
    </div>
    <div class="content">
        <img class="thumbnail" src="https://cdn.akamai.steamstatic.com/steam/apps/{appid}/capsule_616x353.jpg" alt="">
        <div class="action-buttons horizontal-scroll">
            <button class="buy">Buy $17.99</button>
            <button>Save for Later</button>
        </div>
    </div>

    <div class="information">
        <div class="description">
            This is a short description of the game sources from the developers themselves
        </div>
        <div class="label">Information</div>
        <div class="key">Developer</div>
        <div class="val">The Developer</div>
        <div class="key">Developer</div>
        <div class="val">The Developer</div>
        <div class="key">Developer</div>
        <div class="val">The Developer</div>
        <div class="key">Developer</div>
        <div class="val">The Developer</div>
    </div>
</div>

<!--  -->

<style>
    .page{
        display: grid;
        grid-template-columns: 5fr 3fr;
        gap: 1.2rem;
    }

    .game-title{
        display: flex;
        align-items: center;
        grid-column: span 2;
        font-size: 1.6rem;
        font-weight: 600;
    }

    .game-title button{
        display: flex;
        align-items: center;
        justify-content: center;
        height: 125%;
        aspect-ratio: 1 / 1;
        background: var(--l1);
        outline: solid 1pt var(--l2);
        font-size: 1rem;
        margin-right: 1rem;
        border-radius: 100%;
        cursor: pointer;
    }

    .game-title button:hover{
        background: var(--l2);
        outline-color: var(--l4);
    }

    .thumbnail{
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 0.8rem;
    }

    .action-buttons{
        padding-block: 0.8rem;
        padding-inline: 1pt;
    }

    .action-buttons button{
        margin-right: 1.2rem;
        padding: 0.8rem 1.2rem;
        background: var(--l05);
        outline: solid 1pt var(--l2);
        border-radius: 0.4rem;
        cursor: pointer;
    }

    .action-buttons button:hover{
        background: var(--l1);
        outline-color: var(--l3);
    }

    .action-buttons .buy{
        outline-color: var(--green);
    }

    .action-buttons .buy:hover{
        color: lime;
        background: var(--green);
        outline: none;
    }

    .information{
        height: fit-content;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.2rem;
        padding: 1.2rem;
        outline: solid 2pt var(--l2);
        border-radius: 0.8rem;
    }

    .information .description, .information .label{
        grid-column: span 2;
    }

    .information .label{
        font-weight: 600;
    }

    .information .key, .information .val{
        opacity: 0.75;
    }

    .information .val{
        text-align: right;
    }

</style>