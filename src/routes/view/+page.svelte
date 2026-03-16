<script>
    import { page } from '$app/stores';
    import { steamAPI } from '$lib/steam'
    import { beforeUpdate, onMount } from 'svelte';

    let appdata = null
    let appid = null
    let game = null
    let hltb = null
    onMount(() => {
        appid = $page.url.searchParams.get('id')
        steamAPI.getGameDetails(appid, ret => {
            game = ret[appid].data || null
            console.log(game)
        })
        steamAPI.howLongToBeat(appid, ret => {
            hltb = ret || null
        })
    })
</script>

<!--  -->

<div class='page'>
    {#if game}
    <div class="top-bar">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button onclick={() => history.back()}>
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        {game.name}
    </div>
    <div class="content">
        <img class="thumbnail" src="https://cdn.akamai.steamstatic.com/steam/apps/{appid}/capsule_616x353.jpg" alt="">
        <div class="action-buttons horizontal-scroll">
            <button class="buy">Buy $17.99</button>
            <button>Save for Later</button>
        </div>
        <div class="description">
            {game.short_description}
        </div>
    </div>

    <div class="information">
        <div class="label">Information</div>

        <div class="key">Developer</div>
        <div class="val">{game?.developers?.join(", ")}</div>

        <div class="key">Publisher</div>
        <div class="val">{game?.publishers?.join(", ")}</div>

        <div class="key">Genres</div>
        <div class="val">{game?.genres.map(g => g.description).join(", ")}</div>
        
        <div class="key">Platforms</div>
        <div class="val">
            {Object.entries(game?.platforms ?? {})
                .filter(([_, v]) => v)
                .map(([k]) => k[0].toUpperCase() + k.slice(1))
                .join(", ")}
        </div>

        <div class="key">Released</div>
        <div class="val">{game?.release_date?.date}</div>

        <div class="label">Estimated Play Time</div>

        <div class="key">Completionist</div>
        <div class="val">{Math.trunc(hltb?.completionist)}h {(hltb?.completionist % 1 * 60).toFixed(0)}m</div>

        <div class="key">Main Story</div>
        <div class="val">{Math.trunc(hltb?.mainStory)}h {(hltb?.mainStory % 1 * 60).toFixed(0)}m</div>

        <div class="key">Main Story + Extras</div>
        <div class="val">{Math.trunc(hltb?.mainStoryWithExtras)}h {(hltb?.mainStoryWithExtras % 1 * 60).toFixed(0)}m</div>
    </div>
    {/if}
</div>

<!--  -->

<style>
    .page{
        display: grid;
        grid-template-columns: 5fr 3fr;
        gap: 1.2rem;
    }

    .content{
        display: grid;
        gap: 1.2rem;
    }

    .top-bar{
        display: flex;
        align-items: center;
        grid-column: span 2;
        font-size: 1.4rem;
        font-weight: 600;
    }

    .top-bar button{
        display: flex;
        align-items: center;
        justify-content: center;
        height: 2rem;
        aspect-ratio: 1 / 1;
        background: var(--l1);
        outline: solid 1pt var(--l2);
        font-size: 1rem;
        margin-right: 1rem;
        border-radius: 100%;
        cursor: pointer;
    }

    .top-bar button:hover{
        background: var(--l2);
        outline-color: var(--l4);
    }

    .thumbnail{
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 0.4rem;
    }

    .action-buttons button{
        margin: 1pt;
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
        grid-template-columns: min-content auto;
        gap: 1.2rem;
        padding: 1.2rem;
        outline: solid 2pt var(--l2);
        border-radius: 0.8rem;
    }

    .information .label{
        grid-column: span 2;
    }

    .information .label{
        font-weight: 600;
    }

    .information .key, .information .val{
        white-space: nowrap;
        opacity: 0.75;
    }

    .information .val{
        text-align: right;
    }

</style>