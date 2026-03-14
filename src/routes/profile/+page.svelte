<script>

    import { db } from '$lib/data'

    let user = null

    db.subscribe(data => {
        user = data?.user
    })

</script>

<!--  -->

<div class='page'>
    {#if user.avatarfull}
    <div class="headline">
        <img class = "pfp" src={user.avatarfull} alt="">
        <div class="name">{user.personaname}</div>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <a href={user.profileurl}>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            Open on Steam
        </a>
    </div>
    {/if}
</div>

<!--  -->

<style>

    .headline{
        display: grid;
        grid-template-columns: min-content auto min-content;
        align-items: center;
        gap: 2.4rem;
    }

    .pfp{
        height: 8rem;
        width: 8rem;
        border-radius: 50%;
    }

    .name{
        font-size: 2.4rem;
        font-weight: 600;
    }

    a{
        padding: 0.8rem 1.2rem;
        outline: solid 2pt var(--l2);
        border-radius: 0.6rem;
        white-space: nowrap;
        cursor: pointer;
    }

    a:hover{
        background: var(--l1);
        outline-color: var(--l3);
    }

    a i{
        margin-right: 0.2rem;
    }

</style>