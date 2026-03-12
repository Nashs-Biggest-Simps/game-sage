<!-- created by Aaron Meche -->
<script>
    import { resolve } from "$app/paths";

</script>

<!--  -->

<div class="left">
    <div class="title">GameSage</div>
    <div class="message">Not sure what game to play next?</div>
    <a href={resolve("/suggest")}>Find My Next Game</a>
</div>

<!--  -->

<style>
    .left{
        padding: 2rem;
        text-align: center;
    }

    .left .title{
        margin-block: 2rem;
        font-size: 3rem;
        font-weight: 700;
    }

    .left .message{
        margin-bottom: 1rem;
        opacity: 0.75;
    }

    .left a{
        width: fit-content;
        margin: auto;
        padding: 0.75rem 2.25rem;
        font-size: 1.25rem;
        font-weight: 500;
        background: var(--l05);
        outline: solid 1pt var(--l3);
        border-radius: 0.5rem;
        cursor: pointer;
    }

    .left a:hover{
        background: var(--l1);
        outline-color: var(--accent);
    }
</style>