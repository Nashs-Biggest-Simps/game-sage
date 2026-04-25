<!-- created by Aaron Meche -->
<script>
    import { db } from "$lib/data"

    let friends = $derived($db?.cache?.friends?.data ?? [])
    let inGame  = $derived(friends.filter(f => f.gameid))
    let online  = $derived(friends.filter(f => !f.gameid && f.personastate > 0))
    let offline = $derived(friends.filter(f => !f.gameid && f.personastate === 0))
</script>

<!--  -->

{#if friends.length > 0}
<div class="stat-bar">
    <div class="stat-item">
        <div class="stat-num">{friends.length}</div>
        <div class="stat-lbl">Friends</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item accent">
        <div class="stat-num">{inGame.length + online.length}</div>
        <div class="stat-lbl">Online</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item ingame">
        <div class="stat-num">{inGame.length}</div>
        <div class="stat-lbl">In-Game</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item dim">
        <div class="stat-num">{offline.length}</div>
        <div class="stat-lbl">Offline</div>
    </div>
</div>
{/if}

<!--  -->

<style>
    .stat-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--lb0);
        border-radius: 1rem;
        outline: solid 1pt var(--l3);
        padding: 0.85rem 1rem;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        flex: 1;
    }

    .stat-num {
        font-size: 1.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1;
    }

    .stat-lbl {
        font-size: 0.62rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.45;
    }

    .stat-item.accent .stat-num { color: hsl(130,55%,55%); }
    .stat-item.ingame .stat-num { color: var(--bright-accent); }
    .stat-item.dim    .stat-num { opacity: 0.4; }

    .stat-divider {
        width: 1pt;
        height: 2rem;
        background: var(--l3);
        flex-shrink: 0;
    }
</style>