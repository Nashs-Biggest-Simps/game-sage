<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'

    let friends  = $derived($db?.cache?.friends?.data ?? [])
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let details  = $derived($db?.cache?.library?.details  ?? {})
    let owned    = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))

    let inGame = $derived(friends.filter(f => f.gameid))

    function openGameDetails(gameid) {
        goto(resolve(`/view?id=${gameid}`))
    }

    function handleRowKeydown(event, gameid) {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        openGameDetails(gameid)
    }

    function launchGame(event, gameid) {
        event.stopPropagation()
        window.location.href = `steam://run/${gameid}`
    }

    function formatFriendPreview(friends) {
        const names = friends.map(friend => friend.personaname).filter(Boolean)

        if (names.length === 0) return 'Friends are in-game now'
        if (names.length === 1) return names[0]
        if (names.length === 2) return `${names[0]} and ${names[1]}`
        return `${names[0]}, ${names[1]} +${names.length - 2} more`
    }

    let ownedGroups = $derived(() => {
        const map = {}

        for (const friend of inGame) {
            const key = String(friend.gameid)
            if (!owned.has(key)) continue

            if (!map[key]) {
                map[key] = {
                    gameid: friend.gameid,
                    name: details[key]?.data?.name ?? friend.gameextrainfo ?? 'Unknown',
                    friends: [],
                    hours: Math.round((playtime[key] ?? 0) / 60),
                }
            }

            map[key].friends.push(friend)
        }

        return Object.values(map)
            .map((group) => {
                const liveCount = group.friends.length

                return {
                    ...group,
                    friendPreview: formatFriendPreview(group.friends),
                    liveCount,
                    liveLabel: `${liveCount} friend${liveCount !== 1 ? 's' : ''} playing now`,
                }
            })
            .sort((a, b) => {
                if (b.liveCount !== a.liveCount) return b.liveCount - a.liveCount
                return b.hours - a.hours
            })
    })

    let show = $derived(ownedGroups().length > 0)
</script>

{#if show}
<section class="panel">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-users"></i>
            Play With Friends
        </div>

        <div class="join-pills">
            {#if ownedGroups().length > 1}
                <span class="pill shadow">{ownedGroups().length} shared games</span>
            {/if}
            <span class="pill accent">
                <i class="fa-solid fa-circle live-dot"></i>
                LIVE
            </span>
        </div>
    </div>

    <div class="join-list">
        {#each ownedGroups() as game (game.gameid)}
            <div
                class="join-row"
                role="link"
                tabindex="0"
                aria-label={`Open ${game.name}`}
                onclick={() => openGameDetails(game.gameid)}
                onkeydown={(event) => handleRowKeydown(event, game.gameid)}
            >
                <div
                    class="j-art"
                    style="background-image:url('https://cdn.akamai.steamstatic.com/steam/apps/{game.gameid}/capsule_616x353.jpg')"
                ></div>

                <div class="j-info">
                    <div class="j-name">{game.name}</div>
                    <div class="j-summary">{game.friendPreview}</div>

                    <div class="j-meta">
                        <div class="j-friends">
                            <div class="j-avs">
                                {#each game.friends.slice(0, 5) as friend (friend.steamid)}
                                    <img class="j-av" src={friend.avatarmedium} alt={friend.personaname} title={friend.personaname} loading="lazy" />
                                {/each}
                                {#if game.liveCount > 5}
                                    <div class="j-av-more">+{game.liveCount - 5}</div>
                                {/if}
                            </div>
                            <span class="j-count">{game.liveLabel}</span>
                        </div>
                    </div>
                </div>

                <div class="j-side">
                    {#if game.hours > 0}
                        <div class="j-hours">
                            <div class="j-hours-value">
                                {game.hours.toLocaleString()}<span class="j-hours-unit">h</span>
                            </div>
                            <div class="j-hours-label">PLAYED</div>
                        </div>
                    {/if}

                    <button
                        class="j-launch"
                        title="Launch {game.name}"
                        aria-label="Launch {game.name}"
                        onclick={(event) => launchGame(event, game.gameid)}
                    >
                        <i class="fa-solid fa-play"></i>
                        <span>Play</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .live-dot { font-size: 0.4rem; }

    .join-pills {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
        margin-left: auto;
    }

    .join-list {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .join-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 0.85rem;
        align-items: stretch;
        padding: 0.6rem 0.85rem 0.6rem 0.5rem;
        border-radius: 0.7rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .join-row:hover { background: var(--l1); }

    .j-art {
        height: 100%;
        aspect-ratio: 616 / 353;
        border-radius: 0.45rem;
        background: var(--l2) center / cover no-repeat;
        flex-shrink: 0;
    }

    .j-info {
        display: flex;
        flex-direction: column;
        gap: 0.32rem;
        justify-content: center;
        min-width: 0;
    }

    .j-name {
        font-size: 0.92rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .j-summary {
        font-size: 0.72rem;
        opacity: 0.5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .j-meta {
        display: flex;
        align-items: center;
        min-width: 0;
    }

    .j-friends {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    .j-avs { display: flex; align-items: center; flex-direction: row-reverse; }

    .j-av {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.25rem;
        object-fit: cover;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }

    .j-av:last-child { margin-left: 0; }

    .j-av-more {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.25rem;
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.58rem;
        font-weight: 700;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }

    .j-count {
        font-size: 0.74rem;
        opacity: 0.55;
        white-space: nowrap;
    }

    .j-side {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        gap: 0.35rem;
        min-width: 4rem;
        flex-shrink: 0;
    }

    .j-hours {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.35rem;
    }

    .j-hours-value {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: 0.01em;
        line-height: 1;
        color: var(--bright-accent);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .j-hours-unit {
        font-size: 1.1rem;
        font-weight: 700;
        opacity: 0.7;
        letter-spacing: 0;
    }

    .j-hours-label {
        font-size: 0.58rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.35;
    }

    .j-launch {
        width: auto;
        min-width: 4rem;
        height: 1.85rem;
        padding: 0 0.7rem;
        border-radius: 0.45rem;
        background: var(--l1);
        color: inherit;
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        font-size: 0.62rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 120ms, color 120ms, opacity 120ms;
        outline: solid 1pt var(--l3);
    }

    .j-launch:hover {
        background: var(--la2);
        color: var(--bright-accent);
        opacity: 1;
    }

    @media (max-width: 640px) {
        .join-row {
            grid-template-columns: 1fr;
        }

        .j-art {
            width: 100%;
            height: auto;
        }

        .j-side {
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            min-width: 0;
        }

        .j-side:has(.j-hours) {
            justify-content: space-between;
        }

        .j-hours {
            align-items: flex-start;
        }
    }
</style>
