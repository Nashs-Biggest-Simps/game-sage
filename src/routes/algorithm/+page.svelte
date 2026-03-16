<!-- created by Aaron Meche -->
<script>
    import { Algorithm } from "$lib/algorithm";
    import { steamAPI } from "$lib/steam";
    import { onMount } from "svelte";

    const userAlg = new Algorithm("alpha")
    let playedGames = []
    let ownedGames = []

    let library = ""
    onMount(() => {
        userAlg.assemble()
    })

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

</script>

<!--  -->

<div class="output">
    <div class="line">Algorithm</div>
    <div class="line">Library: {library}</div>
</div>

<!--  -->

<style>
    .output{
        display: grid;
        padding: 1rem;
        gap: 2pt;
        outline: solid 2pt var(--l2);
    }

    .line{
        background: var(--l1);
        padding: 1rem;
    }

</style>