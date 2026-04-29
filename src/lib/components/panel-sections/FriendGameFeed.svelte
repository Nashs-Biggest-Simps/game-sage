<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'

    const MIN_IN_GAME = 2

    let friends = $derived($db?.cache?.friends?.data ?? [])
    let details = $derived($db?.cache?.library?.details ?? {})
    let owned   = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
    let inGame  = $derived(friends.filter(f => f.gameid))

    let gameGroups = $derived(() => {
        const map = {}
        for (const f of inGame) {
            const key = String(f.gameid)
            if (!map[key]) map[key] = {
                gameid:  f.gameid,
                name:    details[key]?.data?.name ?? f.gameextrainfo ?? 'Unknown',
                owned:   owned.has(key),
                friends: [],
            }
            map[key].friends.push(f)
        }
        return Object.values(map).sort((a, b) => b.friends.length - a.friends.length).slice(0, 6)
    })

    let show = $derived(inGame.length >= MIN_IN_GAME)
</script>

{#if show}
<section class="panel">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-gamepad"></i>
            Friends In-Game
        </div>
        <span class="pill accent">
            <i class="fa-solid fa-circle live-dot"></i>
            live
        </span>
    </div>

    <div class="feed-grid">
        {#each gameGroups() as g (g.gameid)}
            <div
                class="feed-card"
                role="button"
                tabindex="0"
                onclick={() => goto(resolve(`/view?id=${g.gameid}`))}
                onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.gameid}`))}
            >
                <div class="fc-art" style="background-image:url('https://cdn.akamai.steamstatic.com/steam/apps/{g.gameid}/capsule_616x353.jpg')">
                    <div class="fc-overlay">
                        {#if g.owned}
                            <span class="fc-badge owned">In Library</span>
                        {:else}
                            <span class="fc-badge">Not Owned</span>
                        {/if}
                    </div>
                </div>
                <div class="fc-info">
                    <div class="fc-name">{g.name}</div>
                    <div class="fc-friends">
                        <div class="fc-avs">
                            {#each g.friends.slice(0, 4) as f (f.steamid)}
                                <img class="fc-av" src={f.avatarmedium} alt={f.personaname} title={f.personaname} loading="lazy" />
                            {/each}
                        </div>
                        <span class="fc-count">{g.friends.length} playing</span>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .live-dot { font-size: 0.4rem; }

    .feed-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
    }

    .feed-card {
        display: flex;
        flex-direction: column;
        border-radius: 0.7rem;
        overflow: hidden;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        cursor: pointer;
        transition: outline-color 120ms, transform 120ms;
    }

    .feed-card:hover { outline-color: var(--accent); transform: translateY(-2px); }

    .fc-art {
        width: 100%;
        aspect-ratio: 616 / 353;
        background: var(--l2) center / cover no-repeat;
        position: relative;
    }

    .fc-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
        display: flex;
        align-items: flex-end;
        padding: 0.4rem;
    }

    .fc-badge {
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 100vh;
        background: rgba(0,0,0,0.55);
        color: rgba(255,255,255,0.65);
        backdrop-filter: blur(4px);
    }

    .fc-badge.owned { background: var(--la2); color: var(--bright-accent); }

    .fc-info {
        padding: 0.5rem 0.6rem 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .fc-name {
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fc-friends { display: flex; align-items: center; gap: 0.4rem; }

    .fc-avs { display: flex; flex-direction: row-reverse; }

    .fc-av {
        width: 1.3rem;
        height: 1.3rem;
        border-radius: 0.2rem;
        object-fit: cover;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.3rem;
    }

    .fc-av:last-child { margin-left: 0; }

    .fc-count { font-size: 0.68rem; opacity: 0.55; }
</style>
