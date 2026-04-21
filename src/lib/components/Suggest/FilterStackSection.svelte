<!-- created by Aaron Meche -->
<script>
    import { db } from '$lib/data'

    let { label, options } = $props()

    let key     = $derived(label.replaceAll(' ', '_'))
    let current = $derived($db?.filters?.[key] ?? options[0])

    function select(option) {
        db.update(data => {
            data.filters = { ...data.filters, [key]: option }
            return data
        })
    }
</script>

<section>
    <div class="label">{label}</div>
    <div class="options">
        {#each options as option}
            <button
                class="item {current === option ? 'active' : ''}"
                onclick={() => select(option)}
            >
                <span class="dot"></span>
                {option}
            </button>
        {/each}
    </div>
</section>

<style>
    section {
        margin-bottom: 1.4rem;
    }

    .label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.45;
        margin-bottom: 0.5rem;
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .item {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.4rem 0.6rem;
        border-radius: 0.5rem;
        font-size: 0.83rem;
        font-weight: 500;
        cursor: pointer;
        color: inherit;
        opacity: 0.55;
        transition: background 120ms, opacity 120ms;
        text-align: left;
        width: 100%;
    }

    .item:hover { background: var(--l1); opacity: 1; }

    .item.active {
        background: var(--la1);
        color: var(--bright-accent);
        opacity: 1;
        outline: solid 1pt var(--la2);
    }

    .dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--l3);
        flex-shrink: 0;
        transition: background 120ms;
    }

    .item.active .dot { background: var(--accent); }
</style>
