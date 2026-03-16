<script>
    import { resolve } from "$app/paths";



    let { game } = $props()


</script>

<!--  -->

<a href={resolve(`/view?name=${game.name}&id=${game.steam_appid}`)} class="item">
    <img class="thumbnail" src="https://cdn.akamai.steamstatic.com/steam/apps/{game.steam_appid}/capsule_616x353.jpg" alt="">
    <div class="details">
        <div class="game-title">{game.name}</div>
        <div class="line">{game.is_free ? "Free" : game.price_overview.final_formatted}</div>
        <div class="tags">
            {#each game.genres as genre}
                <div class="item">{genre.description}</div>
            {/each}
        </div>
    </div>
</a>

<!--  -->

<style>
    .item{
        display: grid;
        gap: 0.6rem;
        padding: 0.6rem;
        padding-bottom: 1.2rem;
        cursor: pointer;
        border-radius: 1.2rem;
        opacity: 0.9;
    }

    .item:hover{
        background: var(--l1);
        outline: solid 1pt var(--l3);
        opacity: 1;
    }

    
    .thumbnail{
        width: 100%;
        background: var(--l2);
        object-fit: cover;
        border-radius: 0.6rem;
    }

    .details{
        display: grid;
        gap: 0.2rem;
        margin-inline: 0.6rem;
    }

    .game-title{
        font-size: 1.1rem;
        font-weight: 500;
    }

    .line{
        font-size: 0.9rem;
        opacity: 0.75;
    }

    .tags .item{
        display: inline-block;
        width: fit-content;
        font-size: 0.7rem;
        padding: 0.4rem 0.6rem;
        margin-top: 0.6rem;
        margin-right: 0.6rem;
        background: var(--l1);
        outline: solid 1pt var(--l2);
        border-radius: 100vh;
    }

    .item:hover .tags .item{
        background: var(--l2);
    }
</style>