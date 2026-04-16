<script>
    import CurrentlyPlayingItem from "$lib/components/Home/CurrentlyPlayingItem.svelte";
    import { steamAPI } from "$lib/steam.js";
    import { onMount } from "svelte";

    let recentGames = [];

    onMount(() => {
        steamAPI.getRecentlyPlayedGames((data) => {
            recentGames = data.response.games;
            console.log(recentGames);
        });
    });
</script>

<!--  -->

<div class="wrapper">
    {#each recentGames as game (game.appid)}
        <CurrentlyPlayingItem 
            name={game.name} 
            message={`${Math.trunc(game.playtime_forever/60)} Hours Played`}
            appID={game.appid} 
        />
    {/each}
</div>


<!--  -->

<style>
    .wrapper{
        display: grid;
        /* gap: 1.6rem; */
    }
</style>