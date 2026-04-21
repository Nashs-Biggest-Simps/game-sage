<script>
    //
    // ActivityFeed.svelte
    //
    // GameSage
    // written by Aaron Meche
    //

    import { onMount } from 'svelte'
    import { steamAPI } from '$lib/steam'

    let friends = $state([])
    let loading = $state(true)
    let error   = $state(false)

    const STATE_LABEL = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play']

    function timeAgo(unix) {
        if (!unix) return ''
        const secs = Math.floor(Date.now() / 1000) - unix
        if (secs < 60)     return 'just now'
        if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return `${Math.floor(secs / 604800)}w ago`
    }

    function statusClass(f) {
        if (f.gameid)           return 'in-game'
        if (f.personastate > 0) return 'online'
        return 'offline'
    }

    onMount(() => {
        steamAPI.getFriendList(data => {
            const ids = (data?.friendslist?.friends ?? []).map(f => f.steamid)
            if (!ids.length) { loading = false; return }
            
            steamAPI.getPlayerSummaries(ids.slice(0, 50), res => {
                const players = res?.response?.players ?? []
                if (!players.length) { loading = false; return }

                // Sort by Active -> Online -> Last Active
                friends = players.sort((a, b) => {
                    const aScore = a.gameid ? 2 : a.personastate > 0 ? 1 : 0
                    const bScore = b.gameid ? 2 : b.personastate > 0 ? 1 : 0
                    if (aScore !== bScore) return bScore - aScore
                    return (b.lastlogoff ?? 0) - (a.lastlogoff ?? 0)
                }).slice(0, 14)
                loading = false
            })
        })
    })
</script>

<!--  -->

<div class="feed">
    {#if loading}
        {#each Array(5) as _}
            <div class="skeleton"></div>
        {/each}

    {:else if error || friends.length === 0}
        <div class="empty">
            <i class="fa-solid fa-user-group"></i>
            <span>No friend activity — friends list may be private</span>
        </div>

    {:else}
        {#each friends as f (f.steamid)}
            <div class="friend {statusClass(f)}">
                <div class="avatar-wrap">
                    <img class="avatar" src={f.avatarfull} alt="" loading="lazy" />
                    <div class="dot" title={STATE_LABEL[f.personastate ?? 0]}></div>
                </div>
                <div class="info">
                    <div class="name">{f.personaname}</div>
                    {#if f.gameid}
                        <div class="activity playing">
                            <i class="fa-solid fa-gamepad"></i>
                            {f.gameextrainfo}
                        </div>
                    {:else if f.lastlogoff}
                        <div class="activity">{timeAgo(f.lastlogoff)}</div>
                    {:else}
                        <div class="activity">{STATE_LABEL[f.personastate ?? 0]}</div>
                    {/if}
                </div>
            </div>
        {/each}
    {/if}
</div>

<!--  -->

<style>
    .feed {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .friend {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.8rem;
        padding: 0.55rem 0.7rem;
        border-radius: 0.6rem;
        align-items: center;
        transition: background 120ms;
    }

    .friend:hover { background: var(--l1); }

    .avatar-wrap {
        position: relative;
        width: 2.2rem;
        height: 2.2rem;
        flex-shrink: 0;
    }

    .avatar {
        width: 100%;
        height: 100%;
        border-radius: 0.4rem;
        object-fit: cover;
        display: block;
        background: var(--l3);
    }

    .dot {
        position: absolute;
        bottom: -0.2rem;
        right: -0.2rem;
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 100%;
        border: 2px solid var(--bg);
        background: var(--l4);
    }

    .online .dot  { background: hsl(130, 55%, 45%); }
    .in-game .dot { background: var(--accent); }

    .name {
        font-size: 0.83rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .activity {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.73rem;
        opacity: 0.5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .activity.playing {
        opacity: 0.85;
        color: var(--bright-accent);
    }

    .skeleton {
        height: 3rem;
        border-radius: 0.6rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    .empty {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1.2rem 0.8rem;
        font-size: 0.82rem;
        opacity: 0.4;
    }

    .empty i { font-size: 1.1rem; flex-shrink: 0; }
</style>
