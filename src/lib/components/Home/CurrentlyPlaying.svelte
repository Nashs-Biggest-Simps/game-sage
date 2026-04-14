<script>
    import CurrentlyPlayingItem from "$lib/components/Home/CurrentlyPlayingItem.svelte";



</script>

<!--  -->

<div class="wrapper">
    <CurrentlyPlayingItem name="Elden Ring" message="45 Hours Played" appID="1245620" />
    <CurrentlyPlayingItem name="Cyberpunk 2077" message="23 Hours Played" appID="1091500" />
    <CurrentlyPlayingItem name="Counter-Strike 2" message="13 Hours Played" appID="730" />
    <CurrentlyPlayingItem name="Fallout" message="13 Hours Played" appID="38400" />
</div>

<!--  -->

<style>
    .wrapper{
        display: grid;
        /* gap: 1.6rem; */
    }
</style>