<!-- created by Aaron Meche -->
<script>
    import { onMount } from "svelte";
    import { steamAPI } from "$lib/steam";

    let { game } = $props()
    let news = $state([])


    onMount(() => {
        if (!game) return
        steamAPI.getNewsForApp(game?.appid, ret => {
            news = ret?.appnews?.newsitems?.slice(0, 3) ?? []
        })
    })

    function newsDate(unix) {
        return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

</script>

<!--  -->

{#if news.length > 0}
<section class="row-section">
    <div class="row-header">
        <span class="row-title">What's New</span>
        <span class="news-game-label">for {game.name}</span>
    </div>
    <div class="news-list">
        {#each news as item (item.gid)}
            <a href={item.url} target="_blank" rel="noopener noreferrer" class="news-item">
                <div class="news-top">
                    <span class="news-source">{item.feedlabel}</span>
                    <span class="news-date">{newsDate(item.date)}</span>
                </div>
                <div class="news-title">{item.title}</div>
            </a>
        {/each}
    </div>
</section>
{/if}

<!--  -->

<style>
    .news-list {
        display: flex;
        flex-direction: column;
        background: var(--lb0);
        border-radius: 1rem;
        outline: solid 1pt var(--l3);
        overflow: hidden;
    }

    .news-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.9rem 1.1rem;
        text-decoration: none;
        border-bottom: 1pt solid var(--l2);
        transition: background 140ms;
    }

    .news-item:last-child { border-bottom: none; }
    .news-item:hover { background: var(--l1); }

    .news-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .news-source {
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--bright-accent);
        opacity: 0.8;
    }

    .news-date { font-size: 0.68rem; opacity: 0.4; }

    .news-title {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .news-game-label {
        font-size: 0.72rem;
        font-weight: 500;
        opacity: 0.4;
    }

</style>