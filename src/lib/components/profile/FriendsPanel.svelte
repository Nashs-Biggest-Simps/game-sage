<script>
    import { onDestroy, onMount } from 'svelte'
    import { db } from '$lib/data'
    import { refreshFriends } from '$lib/cache'

    const STATE_LABEL = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play']

    let friends = $derived($db?.cache?.friends?.data ?? [])
    let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
    let steamStatus = $derived($db?.cache?.status?.steam ?? null)
    let libraryStatus = $derived($db?.cache?.status?.library ?? null)
    let loading = $derived($db?.cache?.friends == null && !friendsStatus)
    let selectedFilter = $state('all')
    let refreshInterval

    let inGame = $derived(friends.filter(f => f.gameid))
    let online = $derived(friends.filter(f => !f.gameid && f.personastate > 0))
    let offline = $derived(friends.filter(f => !f.gameid && (f.personastate ?? 0) === 0))

    let filteredFriends = $derived(() => {
        if (selectedFilter === 'playing') return inGame
        if (selectedFilter === 'online') return online
        if (selectedFilter === 'offline') return offline
        return friends
    })

    let statusMessage = $derived(() => {
        if (steamStatus?.state === 'missing' || steamStatus?.state === 'invalid') return steamStatus.message
        if (friendsStatus?.state === 'private') return friendsStatus.message
        if (libraryStatus?.state === 'private') return 'Steam library is private. Friend data may be limited until Steam privacy settings are public.'
        return null
    })

    onMount(() => {
        refreshFriends()
        refreshInterval = setInterval(refreshFriends, 60_000)
    })

    onDestroy(() => clearInterval(refreshInterval))

    function statusClass(friend) {
        if (friend.gameid) return 'playing'
        if ((friend.personastate ?? 0) > 0) return 'online'
        return 'offline'
    }

    function statusText(friend) {
        if (friend.gameid) return friend.gameextrainfo ?? 'In game'
        return STATE_LABEL[friend.personastate ?? 0] ?? 'Offline'
    }

    function timeAgo(unix) {
        if (!unix) return 'No recent activity'
        const secs = Math.floor(Date.now() / 1000) - unix
        if (secs < 60) return 'just now'
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return `${Math.floor(secs / 604800)}w ago`
    }
</script>

<section class="friends-panel">
    <div class="friends-header">
        <div>
            <h2 class="panel-heading">Steam Friends</h2>
            <p class="panel-desc">Friend status, live games, and recent activity from your connected Steam account.</p>
        </div>

        <div class="stat-pills">
            <button class="filter-pill {selectedFilter === 'all' ? 'active' : ''}" onclick={() => selectedFilter = 'all'}>
                {friends.length} total
            </button>
            <button class="filter-pill playing {selectedFilter === 'playing' ? 'active' : ''}" onclick={() => selectedFilter = 'playing'}>
                {inGame.length} playing
            </button>
            <button class="filter-pill online {selectedFilter === 'online' ? 'active' : ''}" onclick={() => selectedFilter = 'online'}>
                {online.length} online
            </button>
            <button class="filter-pill {selectedFilter === 'offline' ? 'active' : ''}" onclick={() => selectedFilter = 'offline'}>
                {offline.length} offline
            </button>
        </div>
    </div>

    {#if statusMessage()}
        <div class="notice-panel">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{statusMessage()}</span>
        </div>
    {/if}

    {#if loading}
        <div class="friends-grid">
            {#each Array(6) as _}
                <div class="friend-card skeleton"></div>
            {/each}
        </div>
    {:else if friends.length === 0}
        <div class="empty-state">
            <i class="fa-solid fa-user-lock"></i>
            <div>
                <strong>No friends loaded</strong>
                <span>Your Steam friends list may be private or unavailable. Set your Steam profile and friends list to public, then refresh.</span>
            </div>
        </div>
    {:else}
        <div class="friends-grid">
            {#each filteredFriends() as friend (friend.steamid)}
                <a
                    class="friend-card {statusClass(friend)}"
                    href={friend.profileurl}
                    target="_blank"
                    rel="noopener"
                >
                    <div class="friend-top">
                        <div class="avatar-wrap">
                            <img src={friend.avatarfull ?? friend.avatarmedium} alt="" class="avatar" loading="lazy" />
                            <span class="dot"></span>
                        </div>
                        <div class="friend-main">
                            <div class="friend-name">{friend.personaname}</div>
                            <div class="friend-status">{statusText(friend)}</div>
                        </div>
                    </div>

                    {#if friend.gameid}
                        <div class="game-strip">
                            <div
                                class="game-art"
                                style="background-image: url('https://cdn.akamai.steamstatic.com/steam/apps/{friend.gameid}/capsule_231x87.jpg')"
                            ></div>
                            <div class="game-copy">
                                <span>Currently playing</span>
                                <strong>{friend.gameextrainfo}</strong>
                            </div>
                        </div>
                    {:else}
                        <div class="last-seen">
                            <i class="fa-solid fa-clock"></i>
                            Last seen {timeAgo(friend.lastlogoff)}
                        </div>
                    {/if}
                </a>
            {/each}
        </div>
    {/if}
</section>

<style>
    .friends-panel {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        padding: 1.45rem;
        border-radius: 1.2rem;
        background: hsl(212, 24%, 12%, 0.58);
        outline: solid 1pt hsl(212, 38%, 36%, 0.52);
        box-shadow:
            0 18px 52px hsl(0, 0%, 0%, 0.24),
            inset 0 1px 0 hsl(0, 0%, 100%, 0.05);
        backdrop-filter: blur(26px) saturate(1.24);
        -webkit-backdrop-filter: blur(26px) saturate(1.24);
    }

    .friends-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    .panel-heading {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .panel-desc {
        margin: 0.35rem 0 0;
        color: hsl(212, 18%, 84%, 0.52);
        font-size: 0.82rem;
        line-height: 1.5;
    }

    .stat-pills {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.45rem;
        flex-wrap: wrap;
        flex-shrink: 0;
    }

    .filter-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.85rem;
        padding: 0.34rem 0.72rem;
        border-radius: 100vh;
        background: hsl(212, 24%, 13%, 0.58);
        outline: solid 1pt hsl(212, 34%, 34%, 0.42);
        color: hsl(212, 18%, 84%, 0.62);
        font-size: 0.74rem;
        font-weight: 800;
        cursor: pointer;
        transition: background 140ms, color 140ms, outline-color 140ms;
    }

    .filter-pill:hover,
    .filter-pill.active {
        color: white;
        background: hsl(212, 75%, 50%, 0.34);
        outline-color: hsl(188, 70%, 52%, 0.45);
    }

    .filter-pill.playing.active {
        background: hsl(188, 72%, 36%, 0.38);
    }

    .filter-pill.online.active {
        background: hsl(146, 58%, 34%, 0.38);
    }

    .notice-panel,
    .empty-state {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 1rem 1.15rem;
        border-radius: 1rem;
        background: hsl(38, 45%, 12%, 0.34);
        outline: solid 1pt hsl(38, 55%, 34%, 0.5);
        color: hsl(38, 80%, 70%);
    }

    .empty-state {
        min-height: 10rem;
        justify-content: center;
    }

    .empty-state strong,
    .empty-state span {
        display: block;
    }

    .empty-state span {
        margin-top: 0.25rem;
        font-size: 0.82rem;
        opacity: 0.72;
        line-height: 1.5;
    }

    .friends-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 0.85rem;
    }

    .friend-card {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        padding: 0.9rem;
        border-radius: 1rem;
        background: hsl(212, 24%, 10%, 0.5);
        outline: solid 1pt hsl(212, 38%, 36%, 0.44);
        transition: transform 140ms, outline-color 140ms, background 140ms;
    }

    .friend-card:hover {
        transform: translateY(-2px);
        outline-color: hsl(188, 70%, 52%, 0.5);
        background: hsl(212, 24%, 15%, 0.58);
    }

    .friend-card.playing {
        outline-color: hsl(188, 70%, 45%, 0.48);
        background:
            radial-gradient(circle at 0% 0%, hsl(188, 78%, 44%, 0.14), transparent 12rem),
            hsl(212, 24%, 10%, 0.5);
    }

    .friend-card.online:hover {
        outline-color: hsl(146, 62%, 52%, 0.46);
        background:
            radial-gradient(circle at 0% 0%, hsl(146, 62%, 44%, 0.16), transparent 12rem),
            hsl(212, 24%, 15%, 0.58);
    }

    .friend-top {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
    }

    .avatar-wrap {
        position: relative;
        flex-shrink: 0;
    }

    .avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 0.8rem;
        object-fit: cover;
        outline: solid 1pt hsl(212, 38%, 42%, 0.7);
    }

    .dot {
        position: absolute;
        right: -0.15rem;
        bottom: -0.15rem;
        width: 0.78rem;
        height: 0.78rem;
        border-radius: 50%;
        background: hsl(212, 12%, 40%);
        outline: solid 3px hsl(212, 24%, 10%);
    }

    .playing .dot { background: hsl(188, 82%, 52%); }
    .online .dot { background: hsl(146, 70%, 52%); }

    .friend-main {
        min-width: 0;
    }

    .friend-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.94rem;
        font-weight: 800;
    }

    .friend-status {
        margin-top: 0.15rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: hsl(212, 18%, 84%, 0.52);
        font-size: 0.76rem;
        font-weight: 700;
    }

    .playing .friend-status {
        color: hsl(188, 78%, 72%, 0.88);
    }

    .game-strip {
        display: grid;
        grid-template-columns: 5.2rem minmax(0, 1fr);
        gap: 0.7rem;
        align-items: center;
        padding: 0.55rem;
        border-radius: 0.75rem;
        background: hsl(212, 24%, 7%, 0.38);
        outline: solid 1pt hsl(188, 64%, 36%, 0.24);
    }

    .game-art {
        aspect-ratio: 231 / 87;
        border-radius: 0.45rem;
        background-size: cover;
        background-position: center;
        background-color: hsl(212, 24%, 16%);
    }

    .game-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .game-copy span {
        color: hsl(188, 70%, 70%, 0.62);
        font-size: 0.66rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .game-copy strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.78rem;
    }

    .last-seen {
        display: flex;
        align-items: center;
        gap: 0.42rem;
        color: hsl(212, 18%, 84%, 0.42);
        font-size: 0.74rem;
        font-weight: 700;
    }

    .skeleton {
        min-height: 8.75rem;
        background:
            linear-gradient(90deg, hsl(212, 24%, 12%, 0.48), hsl(212, 24%, 18%, 0.62), hsl(212, 24%, 12%, 0.48));
        background-size: 220% 100%;
        animation: shimmer 1.4s infinite linear;
    }

    @keyframes shimmer {
        from { background-position: 120% 0; }
        to { background-position: -120% 0; }
    }

    @media (max-width: 760px) {
        .friends-header {
            flex-direction: column;
        }

        .stat-pills {
            justify-content: flex-start;
        }
    }

    @media (max-width: 520px) {
        .friends-panel {
            padding: 1.1rem;
        }

        .friends-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
