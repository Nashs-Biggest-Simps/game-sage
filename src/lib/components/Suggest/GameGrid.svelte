<script>
    import GameGridItem from '$lib/components/Suggest/GameGridItem.svelte'


    let { games } = $props()
    // if (!games) games = [
    //     { title: "Elden Ring", category: "RPG", price: 59.99, appid: 1245620 },
    //     { title: "Counter-Strike 2", category: "Shooter", price: 0, appid: 730 },
    //     { title: "Hollow Knight", category: "Metroidvania", price: 14.99, appid: 367520 },
    //     { title: "Stardew Valley", category: "Simulation", price: 14.99, appid: 413150 },
    //     { title: "Hades", category: "Roguelike", price: 24.99, appid: 1145360 },
    //     { title: "Portal 2", category: "Puzzle", price: 9.99, appid: 620 },
    //     { title: "Red Dead Redemption 2", category: "Adventure", price: 59.99, appid: 1174180 },
    //     { title: "Cyberpunk 2077", category: "RPG", price: 59.99, appid: 1091500 },
    //     { title: "Terraria", category: "Sandbox", price: 9.99, appid: 105600 },
    //     { title: "Among Us", category: "Strategy", price: 4.99, appid: 945360 },
    //     { title: "Rust", category: "Survival", price: 39.99, appid: 252490 },
    //     { title: "Deep Rock Galactic", category: "Shooter", price: 29.99, appid: 548430 },
    //     { title: "Celeste", category: "Platformer", price: 19.99, appid: 504230 },
    //     { title: "Dota 2", category: "MOBA", price: 0, appid: 570 },
    //     { title: "Sekiro: Shadows Die Twice", category: "Action", price: 59.99, appid: 814380 },
    //     { title: "Cuphead", category: "Platformer", price: 19.99, appid: 268910 },
    //     { title: "Valheim", category: "Survival", price: 20.99, appid: 892970 },
    //     { title: "Grand Theft Auto V", category: "Action", price: 29.99, appid: 271590 },
    //     { title: "Forza Horizon 5", category: "Racing", price: 59.99, appid: 1551360 },
    //     { title: "Disco Elysium", category: "RPG", price: 39.99, appid: 632470 },
    // ]
</script>

<!--  -->

<div class="grid">
    {#each games as game}
        <GameGridItem game={game} />
    {/each}
</div>

<!--  -->

<style>
    .grid{
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        row-gap: 1.2rem;
    }

</style>