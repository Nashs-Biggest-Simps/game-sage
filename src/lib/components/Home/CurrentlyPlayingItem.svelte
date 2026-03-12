<!-- created by Aaron Meche -->
<script>

    let { name, message } = $props()

</script>

<!--  -->

<div class="item">
    <div class="pfp">
        <i class="fa-solid fa-gamepad"></i>
    </div>
    <div class="content">
        <div class="name">{name}</div>
        <div class="message">{message}</div>
    </div>
</div>

<!--  -->

<style>
    .item{
        display: grid;
        grid-template-columns: min-content auto;
        align-items: center;
        padding: 0.6rem 0.8rem;
        gap: 0.8rem;
    }

    .pfp{
        display: flex;
        align-items: center;
        justify-content: center;
        height: 3rem;
        background: var(--l6);
        color: var(--bg);
        text-align: center;
        font-size: 1.5rem;
        border-radius: 100vh;
        aspect-ratio: 1 / 1;
    }

    .name{
        font-weight: 500;
    }

    .message{
        font-size: 0.8rem;
        opacity: 0.75;
    }

</style>