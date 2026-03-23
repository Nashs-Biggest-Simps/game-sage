<script>

    let { name, message, appID } = $props()

    let url = "https://cdn.cloudflare.steamstatic.com/steam/apps/" + appID + "/library_600x900.jpg"

</script>

<!--  -->

<div class="item">
    <img src={url} alt="">
    <div class="content">
        <div class="name">{name}</div>
        <div class="message">{message}</div>
    </div>
    <button class="play">
        <i class="fa-solid fa-play"></i>
        Play
    </button>
</div>

<!--  -->

<style lang="rue">
    .item{
        display: grid;
        grid-template-columns: min-content auto min-content;
        gap: 1rem;
        padding: 0.8rem 1.6rem;
        align-items: center;
        cursor: pointer;
        opacity: 0.75;
        transition-duration: 250ms;

        .play{
            display: grid;
            grid-template-columns: min-content auto;
            gap: 0.4rem;
            align-items: center;
            padding: 0.8rem 1.6rem;
            font-weight: 600;
            background: var(--l2);
            border-radius: 0.8rem;
        }

        :hover{
            padding-block: 0;
            opacity: 1;
            background: linear-gradient(to right, transparent, var(--accent-low));
            
            .play{
                background: var(--la2);
                color: var(--bright-accent);
            }

            img{
                height: 7.6rem;
            }
        }

    }

    img{
        height: 6rem;
        width: 6rem;
        object-fit: cover;
        border-radius: 0.8rem;
        transition-duration: 250ms;
    }

    .name{
        font-size: 1.4rem;
        font-weight: 500;
    }

    .message{
        font-size: 1.2rem;
        opacity: 0.75;
    }

</style>