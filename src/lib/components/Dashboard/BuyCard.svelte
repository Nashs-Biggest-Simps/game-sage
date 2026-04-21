<script>
    let { name, reason, appid, storeData } = $props()

    let artUrl   = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`
    let price    = storeData?.price?.final_formatted ?? (storeData?.is_free ? 'Free' : null)
    let storeUrl = `https://store.steampowered.com/app/${appid}`
</script>

<a href={storeUrl} target="_blank" rel="noopener noreferrer" class="card">
    <div class="art-wrap">
        <img src={artUrl} alt={name} loading="lazy" />
        <div class="badge">
            <i class="fa-solid fa-cart-shopping"></i>
        </div>
    </div>
    <div class="info">
        <div class="name">{name}</div>
        {#if reason}
            <div class="reason">{reason}</div>
        {/if}
        <div class="price">
            {#if price}
                {price}
            {:else}
                View on Steam &rarr;
            {/if}
        </div>
    </div>
</a>

<style>
    .card {
        display: flex;
        flex-direction: column;
        width: 14rem;
        flex-shrink: 0;
        border-radius: 0.9rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--la2);
        cursor: pointer;
        transition: transform 150ms, outline-color 150ms, box-shadow 150ms;
        text-decoration: none;
    }

    .card:hover {
        transform: translateY(-3px);
        outline-color: var(--bright-accent);
        box-shadow: 0 8px 24px hsl(212, 75%, 50%, 0.15);
    }

    .art-wrap {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    img {
        width: 100%;
        aspect-ratio: 616 / 353;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .card:hover img { transform: scale(1.04); }

    .badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent);
        border-radius: 100vh;
        font-size: 0.65rem;
        color: white;
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 150ms, transform 150ms;
    }

    .card:hover .badge {
        opacity: 1;
        transform: scale(1);
    }

    .info {
        padding: 0.75rem 0.9rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        flex: 1;
    }

    .name {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .reason {
        font-size: 0.72rem;
        opacity: 0.55;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .price {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--bright-accent);
        margin-top: auto;
        padding-top: 0.5rem;
    }
</style>
