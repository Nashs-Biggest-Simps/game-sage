<script>
    import CurrentlyPlayingItem from "$lib/components/Home/CurrentlyPlayingItem.svelte";



</script>

<!--  -->

<div class="wrapper">
    <CurrentlyPlayingItem name="Persona S" message="45 Hours Played" appID="1245620" />
    <CurrentlyPlayingItem name="Dark Souls" message="23 Hours Played" appID="1091500" />
    <CurrentlyPlayingItem name="Half-Life 2" message="13 Hours Played" appID="730" />
    <CurrentlyPlayingItem name="Half-Life 2" message="13 Hours Played" appID="367520" />
</div>

<!--  -->

<style>
    .wrapper{
        display: grid;
        /* gap: 1.6rem; */
    }
</style>