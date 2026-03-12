<!-- created by Aaron Meche -->
<script>
    import { page } from '$app/stores';
    import { getGameDetails } from '$lib/api'

    let appid = null
    let name = null
    let game = null
    $: {
        appid = $page.url.searchParams.get('id')
        name = $page.url.searchParams.get('name')
        game = getGameDetails(appid)
        console.log(game)
    }
</script>

<!--  -->

<div class='page'>
    <div class="game-title">{name}</div>
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
        grid-template-columns: 3fr 2fr;
        padding: 3.6rem 1.2rem;
        gap: 0.8rem 1.2rem;
    }

    .game-title{
        grid-column: span 2;
        font-size: 1.6rem;
        font-weight: 600;
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