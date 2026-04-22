<script>
    let { name, reason, appid, storeData, thumbnail = null, onFeedback = null } = $props()

    let imgFailed = $state(false)
    let feedback  = $state(null) // null | 'liked' | 'disliked'

    let storeUrl = $derived(`https://store.steampowered.com/app/${appid}`)
    let price    = $derived(storeData?.price?.final_formatted ?? (storeData?.is_free ? 'Free' : null))

    $effect(() => { appid; imgFailed = false })

    function giveFeedback(e, liked) {
        e.preventDefault()
        e.stopPropagation()
        feedback = liked ? 'liked' : 'disliked'
        onFeedback?.({ name }, liked)
    }
</script>

<a href={storeUrl} target="_blank" rel="noopener noreferrer" class="card" class:has-feedback={feedback !== null}>
    <div class="art-wrap">
        {#if thumbnail && !imgFailed}
            <img src={thumbnail} alt={name} loading="lazy" onerror={() => imgFailed = true} />
        {:else}
            <div class="art-fallback"></div>
        {/if}

        <div class="hover-overlay">
            <div class="store-badge">
                <i class="fa-solid fa-cart-shopping"></i>
            </div>

            {#if onFeedback}
                <div class="feedback-btns">
                    <button
                        class="fb-btn"
                        class:active={feedback === 'liked'}
                        class:liked={feedback === 'liked'}
                        title="I'd enjoy this"
                        onclick={(e) => giveFeedback(e, true)}
                    >
                        <i class="fa-solid fa-thumbs-up"></i>
                    </button>
                    <button
                        class="fb-btn"
                        class:active={feedback === 'disliked'}
                        class:disliked={feedback === 'disliked'}
                        title="Not for me"
                        onclick={(e) => giveFeedback(e, false)}
                    >
                        <i class="fa-solid fa-thumbs-down"></i>
                    </button>
                </div>
            {/if}
        </div>
    </div>

    <div class="info">
        <div class="name">{name}</div>
        {#if reason}
            <div class="reason">{reason}</div>
        {/if}
        <div class="price">
            {#if price}{price}{:else}View on Steam &rarr;{/if}
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

    .art-fallback {
        width: 100%;
        aspect-ratio: 616 / 353;
        background: var(--l2);
    }

    img {
        width: 100%;
        aspect-ratio: 616 / 353;
        object-fit: cover;
        display: block;
        transition: transform 200ms;
    }

    .card:hover img { transform: scale(1.04); }

    /* ── Hover overlay — wraps both the store badge and feedback buttons ── */

    .hover-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.5rem;
        pointer-events: none;
    }

    /* Store badge top-right */
    .store-badge {
        align-self: flex-end;
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
        pointer-events: none;
    }

    .card:hover .store-badge {
        opacity: 1;
        transform: scale(1);
    }

    /* Feedback buttons bottom-center */
    .feedback-btns {
        align-self: center;
        display: flex;
        gap: 0.4rem;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 150ms, transform 150ms;
        pointer-events: none;
    }

    .card:hover .feedback-btns,
    .card.has-feedback .feedback-btns {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }

    .fb-btn {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.7rem;
        color: white;
        background: hsl(0, 0%, 0%, 0.6);
        backdrop-filter: blur(4px);
        cursor: pointer;
        transition: background 120ms, transform 100ms;
        pointer-events: auto;
    }

    .fb-btn:hover          { transform: scale(1.12); }
    .fb-btn.liked          { background: hsl(140, 60%, 38%); }
    .fb-btn.disliked       { background: hsl(0, 60%, 45%); }
    .fb-btn:not(.active):hover { background: hsl(0, 0%, 20%, 0.8); }

    /* ── Card info ── */

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
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .reason {
        font-size: 0.72rem;
        opacity: 0.55;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
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
