<!-- created by Aaron Meche -->
<script>
    import { db } from "$lib/data"
    import SteamGameImage from '$lib/components/shared/SteamGameImage.svelte'
 
 
    const STATE_LABEL = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Trade', 'Play']
    let friendsLoading = $derived($db?.cache?.friends == null)
    let friends = $derived($db?.cache?.friends?.data ?? [])
    let inGame  = $derived(friends.filter(f => f.gameid))
    let online  = $derived(friends.filter(f => !f.gameid && f.personastate > 0))
    let offline = $derived(friends.filter(f => !f.gameid && f.personastate === 0))
    let showOffline    = $state(false)

    let popularGames = $derived(() => {
        const map = {}
        for (const f of inGame) {
            if (!f.gameid) continue
            if (!map[f.gameid]) map[f.gameid] = { gameid: f.gameid, name: f.gameextrainfo, friends: [] }
            map[f.gameid].friends.push(f)
        }
        return Object.values(map).sort((a, b) => b.friends.length - a.friends.length)
    })

    function timeAgo(unix) {
        if (!unix) return ''
        const secs = Math.floor(Date.now() / 1000) - unix
        if (secs < 60)     return 'just now'
        if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return `${Math.floor(secs / 604800)}w ago`
    }

</script>

<!--  -->

<div class="panel friends-panel">
    <div class="panel-title-row">
        <div class="panel-title">
            <i class="fa-solid fa-user-group"></i>
            Friends
        </div>
        {#if !friendsLoading}
            <div class="feed-counts">
                {#if inGame.length > 0}
                    <span class="fc in-game">{inGame.length} playing</span>
                {/if}
                {#if online.length > 0}
                    <span class="fc online">{online.length} online</span>
                {/if}
            </div>
        {/if}
    </div>

    {#if friendsLoading}
        {#each Array(5) as _}
            <div class="friend-skeleton"></div>
        {/each}
    {:else if friends.length === 0}
        <div class="empty-row">
            <i class="fa-solid fa-user-group"></i>
            <span>Friends list may be private</span>
        </div>
    {:else}
        {#if inGame.length > 0}
            <div class="group-label">In Game</div>
            {#each inGame as friend}
                <div class="friend in-game">
                    <div class="av-wrap">
                        <img class="av" src={friend.avatarmedium} alt="" loading="lazy" />
                        <div class="dot"></div>
                    </div>
                    <div class="f-info">
                        <div class="f-name">{friend.personaname}</div>
                        <div class="f-game">
                            <i class="fa-solid fa-gamepad"></i>
                            {friend.gameextrainfo}
                        </div>
                    </div>
                    <div class="f-side">
                        <SteamGameImage
                            appid={friend.gameid}
                            alt={friend.gameextrainfo ?? 'Game art'}
                            className="f-game-thumb"
                            decorative={true}
                        />
                    </div>
                </div>
            {/each}
        {/if}
    
        {#if online.length > 0}
            <div class="group-label">Online</div>
            {#each online as friend}
                <div class="friend online">
                    <div class="av-wrap">
                        <img class="av" src={friend.avatarmedium} alt="" loading="lazy" />
                        <div class="dot"></div>
                    </div>
                    <div class="f-info">
                        <div class="f-name">{friend.personaname}</div>
                        <div class="f-status">{STATE_LABEL[friend.personastate ?? 0]}</div>
                    </div>
                </div>
            {/each}
        {/if}
    
        {#if offline.length > 0}
            <button class="offline-toggle" onclick={() => showOffline = !showOffline}>
                <i class="fa-solid fa-chevron-{showOffline ? 'up' : 'down'}"></i>
                {showOffline ? 'Hide' : 'Show'} {offline.length} offline
            </button>
            {#if showOffline}
                {#each offline as friend}
                    <div class="friend offline">
                        <div class="av-wrap">
                            <img class="av" src={friend.avatarmedium} alt="" loading="lazy" />
                            <div class="dot"></div>
                        </div>
                        <div class="f-info">
                            <div class="f-name">{friend.personaname}</div>
                            <div class="f-status">{friend.lastlogoff ? timeAgo(friend.lastlogoff) : 'Offline'}</div>
                        </div>
                    </div>
                {/each}
            {/if}
        {/if}
    {/if}
</div>


<!--  -->

<style>
    .group-label {
        font-size: 0.64rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.35;
        padding: 0.6rem 0.4rem 0.15rem;
    }

    .friend {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.65rem;
        padding: 0.45rem 0.55rem;
        border-radius: 0.6rem;
        align-items: center;
        transition: background 120ms;
        cursor: pointer;
    }

    .friend:hover { background: var(--l1); }
    .friend.in-game { background: var(--la1); }
    .friend.in-game:hover { background: var(--la2); }
    .friend.online:hover { background: hsl(130, 42%, 18%, 0.34); }
    .friend.offline { opacity: 0.4; }

    .av-wrap {
        position: relative;
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
    }

    .av {
        width: 100%;
        height: 100%;
        border-radius: 0.35rem;
        object-fit: cover;
        display: block;
        background: var(--l3);
    }

    .dot {
        position: absolute;
        bottom: -0.15rem;
        right: -0.15rem;
        width: 0.6rem;
        height: 0.6rem;
        border-radius: 50%;
        border: 2px solid var(--lb0);
        background: var(--l4);
    }

    .in-game .dot { background: var(--accent); border-color: var(--la1); }
    .online  .dot { background: hsl(130,55%,45%); }

    .f-info { min-width: 0; }

    .f-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .f-game {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.71rem;
        color: var(--bright-accent);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .f-game i { font-size: 0.65rem; flex-shrink: 0; }

    .f-status { font-size: 0.71rem; opacity: 0.5; }

    /* Game thumbnail for in-game friends */
    .f-side { flex-shrink: 0; }

    :global(.f-game-thumb) {
        width: 3.2rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        background: var(--l2);
        display: block;
        object-fit: cover;
        opacity: 0.8;
    }

    .offline-toggle {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.75rem;
        opacity: 0.4;
        cursor: pointer;
        padding: 0.5rem 0.55rem;
        border-radius: 0.5rem;
        color: inherit;
        transition: background 120ms, opacity 120ms;
        margin-top: 0.25rem;
    }

    .offline-toggle:hover { background: var(--l1); opacity: 0.8; }
    .offline-toggle i { font-size: 0.65rem; }

        .panel-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .feed-counts { display: flex; gap: 0.35rem; }

    .fc {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 100vh;
    }
    .fc.in-game { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .fc.online  { background: hsl(130,40%,14%); color: hsl(130,55%,55%); outline: solid 1pt hsl(130,40%,26%); }
    .friends-panel { gap: 0.1rem; }
</style>
