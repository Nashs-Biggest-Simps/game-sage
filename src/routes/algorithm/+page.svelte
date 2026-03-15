<!-- created by Aaron Meche -->
<script>
    import { Algorithm } from "$lib/algorithm";
    import { steamAPICall } from "$lib/steam";
    import { onMount } from "svelte";

    const userAlg = new Algorithm()
    let playedGames = []
    let ownedGames = []

    const exRecentlyPlayedGames = {
        "appid": 255710,
        "name": "Cities: Skylines",
        "playtime_2weeks": 431,
        "playtime_forever": 58135,
        "img_icon_url": "6cf7b10dd29db28448ef79698ed2118a03617d63",
        "playtime_windows_forever": 10,
        "playtime_mac_forever": 58125,
        "playtime_linux_forever": 0,
        "playtime_deck_forever": 0
    }
    const exOwnedGames = {
        "appid": 255710,
        "playtime_2weeks": 431,
        "playtime_forever": 58135,
        "playtime_windows_forever": 10,
        "playtime_mac_forever": 58125,
        "playtime_linux_forever": 0,
        "playtime_deck_forever": 0,
        "rtime_last_played": 1772949314,
        "playtime_disconnected": 1261
    }


    onMount(() => {
        steamAPICall("getRecentlyPlayedGames", ret => {
            playedGames = ret?.response?.games
            userAlg.ingestLibrary(playedGames)
            userAlg.printContents()
        })
        steamAPICall("getOwnedGames", ret => {
            ownedGames = ret?.response.games
        })
    })

</script>

<!--  -->

<div class='page'>
    Algorithm
</div>

<!--  -->

<style>

</style>