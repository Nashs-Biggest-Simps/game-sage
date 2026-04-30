<script>
    import { db } from "$lib/data"
    import SteamGameImage from '$lib/components/shared/SteamGameImage.svelte'

    let byHour  = $derived($db?.cache?.friendPopularity ?? {})
    let friends = $derived($db?.cache?.friends?.data ?? [])
    let inGame  = $derived(friends.filter(f => f.gameid))

    let popularGames = $derived(() => {
        const map = {}

        // Aggregate 7-day hourly buckets — peak concurrent friends per hour per game
        for (const bucket of Object.values(byHour)) {
            for (const [gameid, { name, peak }] of Object.entries(bucket)) {
                if (!map[gameid]) map[gameid] = { gameid: parseInt(gameid), name, score: 0, peakFriends: 0 }
                map[gameid].score       += peak
                map[gameid].peakFriends  = Math.max(map[gameid].peakFriends, peak)
            }
        }

        // Boost currently-playing games so live activity always surfaces
        for (const f of inGame) {
            const key = String(f.gameid)
            if (!map[key]) map[key] = { gameid: f.gameid, name: f.gameextrainfo, score: 0, peakFriends: 0 }
            map[key].score += 8
        }

        // Attach live friend list to each result for avatar display
        return Object.values(map)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(g => ({
                ...g,
                liveFriends: inGame.filter(f => String(f.gameid) === String(g.gameid)),
            }))
    })

    let hasHistory = $derived(Object.keys(byHour).length > 0)
</script>

<div class="panel">
    <div class="panel-title">
        <i class="fa-solid fa-fire"></i>
        Popular with Friends
        {#if !hasHistory}
            <span class="live-tag">live</span>
        {:else}
            <span class="week-tag">7 days</span>
        {/if}
    </div>

    <div class="pop-list">
        {#if popularGames().length > 0}
            {#each popularGames() as game (game.gameid)}
                <div class="pop-row">
                    <SteamGameImage
                        appid={game.gameid}
                        alt={game.name}
                        className="pop-art"
                        decorative={true}
                    />
                    <div class="pop-info">
                        <div class="pop-name">{game.name}</div>
                        <div class="pop-meta">
                            {#if game.liveFriends.length > 0}
                                <span class="live-dot-wrap">
                                    <i class="fa-solid fa-circle dot"></i>
                                    {game.liveFriends.length} playing now
                                </span>
                            {:else}
                                <span class="hist-label">popular this week</span>
                            {/if}
                        </div>
                    </div>
                    <div class="pop-avatars">
                        {#each (game.liveFriends.length ? game.liveFriends : []).slice(0, 3) as f (f.steamid)}
                            <img class="pop-av" src={f.avatarmedium} alt={f.personaname} title={f.personaname} loading="lazy" />
                        {/each}
                        {#if game.peakFriends > 3 && !game.liveFriends.length}
                            <div class="pop-peak">{game.peakFriends} peak</div>
                        {/if}
                    </div>
                </div>
            {/each}
        {:else}
            <div class="empty-row">
                <i class="fa-solid fa-moon"></i>
                <span>No friend activity yet</span>
            </div>
        {/if}
    </div>
</div>

<style>
    .live-tag, .week-tag {
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.12rem 0.45rem;
        border-radius: 100vh;
        margin-left: 0.3rem;
        vertical-align: middle;
    }

    .live-tag  { background: var(--la2); color: var(--bright-accent); }
    .week-tag  { background: var(--l2); opacity: 0.6; }

    .pop-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .pop-row {
        display: grid;
        grid-template-columns: 3.8rem 1fr auto;
        gap: 0.7rem;
        align-items: center;
        padding: 0.45rem 0.6rem 0.45rem 0.4rem;
        border-radius: 0.6rem;
        transition: background 120ms;
    }

    .pop-row:hover { background: var(--l1); }

    :global(.pop-art) {
        width: 3.8rem;
        height: 1.8rem;
        border-radius: 0.35rem;
        background: var(--l2);
        display: block;
        object-fit: cover;
        flex-shrink: 0;
    }

    .pop-info { min-width: 0; }

    .pop-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .pop-meta {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        margin-top: 0.08rem;
    }

    .live-dot-wrap {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.68rem;
        color: var(--bright-accent);
        opacity: 0.85;
    }

    .live-dot-wrap .dot { font-size: 0.35rem; }

    .hist-label {
        font-size: 0.68rem;
        opacity: 0.4;
    }

    .pop-avatars {
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        flex-shrink: 0;
    }

    .pop-av {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        object-fit: cover;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }

    .pop-av:first-child { margin-left: 0; }

    .pop-peak {
        font-size: 0.62rem;
        font-weight: 700;
        opacity: 0.35;
        white-space: nowrap;
    }

    .empty-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 0.5rem;
        font-size: 0.8rem;
        opacity: 0.35;
    }
</style>
