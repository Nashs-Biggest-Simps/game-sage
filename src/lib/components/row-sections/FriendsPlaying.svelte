<!-- created by Aaron Meche -->
<script>
    import { onMount }  from 'svelte'
    import { db }       from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import GameRow      from '$lib/components/games/GameRow.svelte'

    let games   = $state([])
    let loading = $state(true)

    let hasSteamID  = $derived(!!$db?.steamID)
    // Set of owned appids for per-card library detection
    let ownedAppIds = $derived(new Set(Object.keys($db?.cache?.library?.playtime ?? {}).map(Number)))

    async function loadFriends() {
        if (!hasSteamID) { loading = false; return }
        loading = true
        try {
            steamAPI.getFriendList(res => {
                const friends = res?.friendslist?.friends?.slice(0, 50) ?? []
                if (!friends.length) { loading = false; return }

                steamAPI.getPlayerSummaries(friends.map(f => f.steamid), res2 => {
                    const players = res2?.response?.players ?? []
                    games = players
                        .filter(p => p.gameid && p.gameextrainfo)
                        .map(p => ({
                            appid:   parseInt(p.gameid),
                            name:    p.gameextrainfo,
                            reason:  `${p.personaname} is playing right now`,
                            // inLibrary set per-item so GameRowItem shows the right action
                            inLibrary: ownedAppIds.has(parseInt(p.gameid)),
                        }))
                    loading = false
                })
            })
        } catch {
            loading = false
        }
    }

    onMount(loadFriends)
</script>

<!--  -->

{#if games.length >= 2 || loading}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">Games your Friends Keep Playing</div>
    </div>
    <GameRow games={games} />
</section>
{/if}

<!--  -->

<style>

</style>