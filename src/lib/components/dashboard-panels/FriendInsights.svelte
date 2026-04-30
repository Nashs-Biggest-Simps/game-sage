<script>
    import { db } from '$lib/data'
    import SteamGameImage from '$lib/components/shared/SteamGameImage.svelte'

    const MIN_FRIENDS = 5

    let friends = $derived($db?.cache?.friends?.data ?? [])
    let inGame  = $derived(friends.filter(f => f.gameid))
    let online  = $derived(friends.filter(f => f.personastate > 0 || f.gameid))
    let show    = $derived(friends.length >= MIN_FRIENDS)

    let trending = $derived(() => {
        if (!inGame.length) return null
        const map = {}
        for (const f of inGame) {
            const key = f.gameid
            if (!map[key]) map[key] = { gameid: f.gameid, name: f.gameextrainfo, count: 0 }
            map[key].count++
        }
        return Object.values(map).sort((a, b) => b.count - a.count)[0] ?? null
    })
</script>

{#if show}
<div class="panel">
    <div class="panel-title">
        <i class="fa-solid fa-users-viewfinder"></i>
        Friend Insights
    </div>

    <div class="fi-grid">
        <div class="fi-card ingame">
            <div class="fi-val">{inGame.length}</div>
            <div class="fi-lbl">In-game</div>
        </div>
        <div class="fi-card online">
            <div class="fi-val">{online.length}</div>
            <div class="fi-lbl">Online</div>
        </div>
        <div class="fi-card">
            <div class="fi-val">{Math.round((online.length / Math.max(friends.length, 1)) * 100)}%</div>
            <div class="fi-lbl">Active rate</div>
        </div>
        <div class="fi-card dim">
            <div class="fi-val">{friends.length}</div>
            <div class="fi-lbl">Friends</div>
        </div>
    </div>

    {#if trending()}
        {@const t = trending()}
        <div class="trending">
            <div class="trending-lbl">Trending right now</div>
            <div class="tr-row">
                <SteamGameImage
                    appid={t.gameid}
                    alt={t.name}
                    className="tr-art"
                    decorative={true}
                />
                <div class="tr-info">
                    <div class="tr-name">{t.name}</div>
                    <div class="tr-count">{t.count} friend{t.count !== 1 ? 's' : ''} playing</div>
                </div>
            </div>
        </div>
    {/if}
</div>
{/if}

<style>
    .fi-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .fi-card {
        background: var(--l2);
        border-radius: 0.65rem;
        padding: 0.7rem 0.85rem;
        outline: solid 1pt var(--l3);
    }

    .fi-card.ingame  { background: var(--la1);            outline-color: var(--la3); }
    .fi-card.online  { background: hsl(130 45% 11%);      outline-color: hsl(130 40% 24%); }
    .fi-card.dim     { opacity: 0.65; }

    .fi-val {
        font-size: 1.45rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.02em;
    }

    .fi-card.ingame .fi-val { color: var(--bright-accent); }
    .fi-card.online .fi-val { color: hsl(130 55% 55%); }

    .fi-lbl {
        font-size: 0.65rem;
        opacity: 0.5;
        margin-top: 0.2rem;
        font-weight: 500;
    }

    .trending { margin-top: 0.1rem; }

    .trending-lbl {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.4;
        margin-bottom: 0.5rem;
    }

    .tr-row {
        display: grid;
        grid-template-columns: 4rem 1fr;
        gap: 0.65rem;
        align-items: center;
        border-radius: 0.6rem;
        padding: 0.5rem;
        transition: background 120ms;
    }

    .tr-row:hover { background: var(--l1); }

    :global(.tr-art) {
        width: 4rem;
        height: 1.9rem;
        border-radius: 0.3rem;
        background: var(--l2);
        display: block;
        object-fit: cover;
        flex-shrink: 0;
    }

    .tr-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tr-count { font-size: 0.68rem; opacity: 0.5; margin-top: 0.1rem; }
</style>
