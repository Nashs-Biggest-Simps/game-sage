<!-- created by Aaron Meche -->
<script>
    import { onMount } from 'svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import { db } from '$lib/data'
    import GameRow from "../games/GameRow.svelte";
    import GameGrid from '../games/GameGrid.svelte';

    let playtime = $derived($db?.cache?.library?.playtime    ?? {})
    let details  = $derived($db?.cache?.library?.details     ?? {})
    let topGames = $derived(() => {
        const entries = Object.entries(playtime)
            .filter(([id, mins]) => mins > 0 && details[id]?.data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id, mins]) => ({
                appid: parseInt(id),
                hours: Math.round(mins / 60),
                detail: details[id].data,
            }))
        const maxHours = entries[0]?.hours ?? 1
        return entries.map(g => ({ ...g, pct: Math.round((g.hours / maxHours) * 100) }))
    })
    $effect(() => {console.log(topGames())})
</script>

<!--  -->


{#if topGames().length > 0}
<section class="panel">
    <div class="row-header">
        <div class="row-title">Top Games Played</div>
    </div>
    <div class="top-list">
        {#each topGames() as game, i}
            <div class="top-row" role="button" tabindex="0" onclick={() => goto(resolve(`/view?id=${game.appid}`))} onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${game.appid}`))}>
                <div class="rank">{i + 1}</div>
                <div class="top-art">
                    {#if game?.detail?.thumbnail}
                        <img src={game.detail.thumbnail} alt={game.detail.name} loading="lazy" />
                    {:else}
                        <div class="top-art-fallback"></div>
                    {/if}
                </div>
                <div class="top-info">
                    <div class="top-name">{game.detail.name}</div>
                    <div class="top-bar-wrap">
                        <div class="top-bar" style="width: {game.pct}%"></div>
                    </div>
                </div>
                <div class="top-hours">{game.hours.toLocaleString()}h</div>
            </div>
        {/each}
    </div>
</section>
{/if}

<!--  -->

<style>
    .top-list { display: flex; flex-direction: column; gap: 0.15rem; }

    .top-row {
        display: grid;
        grid-template-columns: 1.6rem 3.2rem 1fr auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.5rem 0.4rem;
        border-radius: 0.6rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .top-row:hover { background: var(--l1); }

    .rank { font-size: 0.72rem; font-weight: 700; opacity: 0.35; text-align: center; }

    .top-art {
        width: 3.2rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.35rem;
        overflow: hidden;
        background: var(--l2);
    }

    .top-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .top-art-fallback { width: 100%; height: 100%; background: var(--l3); }

    .top-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }

    .top-name {
        font-size: 0.84rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .top-bar-wrap {
        height: 3px;
        background: var(--l3);
        border-radius: 100vh;
        overflow: hidden;
    }

    .top-bar {
        height: 100%;
        background: var(--accent);
        border-radius: 100vh;
        transition: width 600ms ease;
    }

    .top-hours { font-size: 0.78rem; font-weight: 700; opacity: 0.65; white-space: nowrap; }
</style>