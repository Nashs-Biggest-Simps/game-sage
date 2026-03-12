<!-- created by Aaron Meche -->
<script>
    import FriendActivity from "$lib/components/Home/FriendActivity.svelte";
    import CurrentlyPlaying from "$lib/components/Home/CurrentlyPlaying.svelte"

</script>

<!--  -->

<div class="right">
    <section>
        <div class="title">Friend Activity</div>
        <FriendActivity />
    </section>
    <section>
        <div class="title">Currently Playing</div>
        <CurrentlyPlaying />
    </section>
</div>

<!--  -->

<style>
    .right{
        padding-block: 2rem;
    }

    .right section{
        padding: 2rem;
    }

    .right section .title{
        margin-bottom: 0.8rem;
        font-size: 1.4rem;
        font-weight: 600;
        text-align: center;
    }
</style>