<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";



    let { game } = $props()


</script>

<!--  -->

<a href={resolve(`/view?name=${game.title}&id=${game.appid}`)} class="item">
    <img class="thumbnail" src="https://cdn.akamai.steamstatic.com/steam/apps/{game.appid}/capsule_616x353.jpg" alt="">
    <div class="game-title">{game.title}</div>
    <div class="line">{game.price > 0 ? "$" + game.price : "Free"} • {game.category}</div>
</a>

<!--  -->

<style>
    .item{
        padding: 0.4rem;
        padding-bottom: 1rem;
        cursor: pointer;
        border-radius: 1rem;
        opacity: 0.9;
    }

    .item:hover{
        background: var(--l1);
        outline: solid 1pt var(--l3);
        opacity: 1;
    }

    .thumbnail{
        width: 100%;
        margin-bottom: 0.6rem;
        background: var(--l2);
        object-fit: cover;
        border-radius: 0.6rem;
    }

    .game-title{
        margin-inline: 0.6rem;
        font-size: 1.1rem;
        font-weight: 500;
    }
    .line{
        margin-top: 0.2rem;
        margin-inline: 0.6rem;
        font-size: 0.9rem;
        opacity: 0.75;
    }
</style>