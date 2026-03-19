<!-- created by Aaron Meche -->
<script>
    import { db } from '$lib/data'

    let filters = $derived($db.filters)

    let { label, options, select } = $props()

</script>

<!--  -->

<section>
    <div class="label">{label}</div>
    <div class="options">
        {#each options as option}
            <div class="item {filters[label.replaceAll(" ", "_")] == option ? "active" : ""}">
                <div class="circle"></div>
                {option}
            </div>
        {/each}
    </div>
</section>

<!--  -->

<style lang="rue">

    section{
        margin-bottom: 1.2rem;
    }

    .label{
        font-size: 12pt;
        font-weight: 500;
    }

    .options{
        display: grid;
        gap: 0.6rem;
        margin-top: 0.6rem;
    }

    .item{
        display: grid;
        grid-template-columns: min-content auto;
        gap: 0.6rem;
        opacity: 0.75;
        cursor: pointer;

        :hover{
            opacity: 1;
        }

        .circle{
            height: 100%;
            aspect-ratio: 1 / 1;
            background: var(--l1);
            outline: solid 1pt var(--l3);
            border-radius: 100%;
        }
    }

    .item.active{
        :hover{
            opacity: 1;
        }

        .circle{
            background: var(--accent);
        }
    }
</style>