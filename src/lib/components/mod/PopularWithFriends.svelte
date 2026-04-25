<!-- created by Aaron Meche -->
<script>
    import { db } from "$lib/data"


    let friendsLoading = $derived($db?.cache?.friends == null)
    let friends = $derived($db?.cache?.friends?.data ?? [])
    let inGame  = $derived(friends.filter(f => f.gameid))

    let popularGames = $derived(() => {
        const map = {}
        for (const f of inGame) {
            if (!f.gameid) continue
            if (!map[f.gameid]) map[f.gameid] = { gameid: f.gameid, name: f.gameextrainfo, friends: [] }
            map[f.gameid].friends.push(f)
        }
        return Object.values(map).sort((a, b) => b.friends.length - a.friends.length)
    })

</script>

<!--  -->

<div class="pop-list">
    {#if popularGames().length > 0}
        {#each popularGames() as game (game.gameid)}
            <div class="pop-row">
                <div class="pop-art"
                    style="background-image: url('https://cdn.akamai.steamstatic.com/steam/apps/{game.gameid}/capsule_231x87.jpg')"
                ></div>
                <div class="pop-info">
                    <div class="pop-name">{game.name}</div>
                    <div class="pop-count">
                        {game.friends.length} friend{game.friends.length !== 1 ? 's' : ''} playing
                    </div>
                </div>
                <div class="pop-avatars">
                    {#each game.friends.slice(0, 3) as f (f.steamid)}
                        <img class="pop-av" src={f.avatarmedium} alt={f.personaname} title={f.personaname} loading="lazy" />
                    {/each}
                    {#if game.friends.length > 3}
                        <div class="pop-av-more">+{game.friends.length - 3}</div>
                    {/if}
                </div>
            </div>
        {/each}
    {:else if friendsLoading}
        {#each Array(3) as _}<div class="friend-skeleton"></div>{/each}
    {:else}
        <div class="empty-row">
            <i class="fa-solid fa-moon"></i>
            <span>No friends in a game right now</span>
        </div>
    {/if}
</div>

<!--  -->

<style>
    .pop-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .pop-row {
        display: grid;
        grid-template-columns: 3.6rem 1fr auto;
        gap: 0.7rem;
        align-items: center;
        padding: 0.45rem 0.4rem;
        border-radius: 0.6rem;
        transition: background 120ms;
        cursor: default;
    }

    .pop-row:hover { background: var(--l1); }

    .pop-art {
        width: 3.6rem;
        height: 1.7rem;
        border-radius: 0.35rem;
        background: var(--l2);
        background-size: cover;
        background-position: center;
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

    .pop-count {
        font-size: 0.68rem;
        opacity: 0.5;
        margin-top: 0.08rem;
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

    .pop-av-more {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.3rem;
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.58rem;
        font-weight: 700;
        opacity: 0.7;
        border: 1.5pt solid var(--lb0);
        margin-left: -0.4rem;
    }
</style>