<script>
    import { db }      from '$lib/data'
    import { goto }    from '$app/navigation'
    import { resolve } from '$app/paths'

    let friends  = $derived($db?.cache?.friends?.data ?? [])
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let details  = $derived($db?.cache?.library?.details  ?? {})
    let owned    = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))

    let inGame = $derived(friends.filter(f => f.gameid))

    let ownedGroups = $derived(() => {
        const map = {}
        for (const f of inGame) {
            const key = String(f.gameid)
            if (!owned.has(key)) continue
            if (!map[key]) map[key] = {
                gameid:  f.gameid,
                name:    details[key]?.data?.name ?? f.gameextrainfo ?? 'Unknown',
                friends: [],
                genres:  (details[key]?.data?.genres ?? []).slice(0, 2).map(g => g.description),
                hours:   Math.round((playtime[key] ?? 0) / 60),
            }
            map[key].friends.push(f)
        }
        return Object.values(map).sort((a, b) => b.friends.length - a.friends.length)
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
        <span class="pill accent">
            <i class="fa-solid fa-circle live-dot"></i>
            live
        </span>
    </div>

    <div class="join-list">
        {#each ownedGroups() as g (g.gameid)}
            <div
                class="join-row"
                role="button"
                tabindex="0"
                onclick={() => goto(resolve(`/view?id=${g.gameid}`))}
                onkeydown={(e) => e.key === 'Enter' && goto(resolve(`/view?id=${g.gameid}`))}
            >
                <div class="j-art" style="background-image:url('https://cdn.akamai.steamstatic.com/steam/apps/{g.gameid}/capsule_616x353.jpg')"></div>

                <div class="j-info">
                    <div class="j-name">{g.name}</div>
                    {#if g.genres.length}
                        <div class="j-tags">
                            {#each g.genres as genre}
                                <span class="tag">{genre}</span>
                            {/each}
                        </div>
                    {/if}
                    <div class="j-friends">
                        <div class="j-avs">
                            {#each g.friends.slice(0, 5) as f (f.steamid)}
                                <img class="j-av" src={f.avatarmedium} alt={f.personaname} title={f.personaname} loading="lazy" />
                            {/each}
                            {#if g.friends.length > 5}
                                <div class="j-av-more">+{g.friends.length - 5}</div>
                            {/if}
                        </div>
                        <span class="j-count">{g.friends.length} friend{g.friends.length !== 1 ? 's' : ''} in-game</span>
                    </div>
                </div>

                <div class="j-side">
                    {#if g.hours > 0}
                        <div class="j-hours">{g.hours}h</div>
                        <div class="j-hours-lbl">your time</div>
                    {/if}
                    <button
                        class="j-launch"
                        title="Launch {g.name}"
                        onclick={(e) => { e.stopPropagation(); window.location.href = `steam://run/${g.gameid}` }}
                    >
                        <i class="fa-solid fa-play"></i>
                    </button>
                </div>
            </div>
        {/each}
    </div>
</section>
{/if}

<style>
    .live-dot { font-size: 0.4rem; }

    .join-list { display: flex; flex-direction: column; gap: 0.15rem; }

    .join-row {
        display: grid;
        grid-template-columns: 5.5rem 1fr auto;
        gap: 0.85rem;
        align-items: center;
        padding: 0.6rem 0.85rem 0.6rem 0.5rem;
        border-radius: 0.7rem;
        cursor: pointer;
        transition: background 120ms;
    }

    .join-row:hover { background: var(--l1); }

    .j-art {
        width: 5.5rem;
        aspect-ratio: 616 / 353;
        border-radius: 0.45rem;
        background: var(--l2) center / cover no-repeat;
        flex-shrink: 0;
    }

    .j-info {
        display: flex;
        flex-direction: column;
        gap: 0.32rem;
        min-width: 0;
    }

    .j-name {
        font-size: 0.92rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .j-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }

    .j-friends { display: flex; align-items: center; gap: 0.5rem; }

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

    .j-count { font-size: 0.74rem; opacity: 0.55; white-space: nowrap; }

    .j-side {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.15rem;
        flex-shrink: 0;
    }

    .j-hours { font-size: 0.92rem; font-weight: 800; color: var(--bright-accent); line-height: 1; }
    .j-hours-lbl { font-size: 0.65rem; opacity: 0.4; white-space: nowrap; }

    .j-launch {
        margin-top: 0.35rem;
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background: var(--la2);
        color: var(--bright-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        cursor: pointer;
        transition: background 120ms, transform 120ms;
        outline: solid 1pt var(--la3);
    }

    .j-launch:hover { background: var(--accent); color: white; transform: scale(1.08); }
</style>
