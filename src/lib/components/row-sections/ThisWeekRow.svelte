<script>
    import GameRow from '$lib/components/games/GameRow.svelte'
    import { db } from '$lib/data'

    let recent  = $derived($db?.cache?.recentlyPlayed?.data ?? [])
    let details = $derived($db?.cache?.library?.details ?? {})

    // Sort by 2-week playtime — different from "Jump Back In" which uses Steam's
    // last-played order. This surfaces what the user has been grinding most.
    let sorted = $derived(
        recent
            .filter(g => (g.playtime_2weeks ?? 0) > 0)
            .sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
    )

    let games = $derived(
        sorted.map(g => {
            const hrs    = Math.round((g.playtime_2weeks ?? 0) / 60)
            const cached = details[g.appid]?.data ?? null
            return {
                appid:            g.appid,
                name:             g.name,
                thumbnail:        cached?.thumbnail ?? null,
                playtime_forever: g.playtime_forever ?? 0,
                reason:           hrs > 0 ? `${hrs}h this week` : 'In rotation this week',
            }
        })
    )
</script>

{#if games.length >= 2}
<section class="row-section">
    <div class="row-header">
        <div class="row-title">
            <i class="fa-solid fa-calendar-week"></i>
            On Rotation This Week
        </div>
        <span class="sub">sorted by hours</span>
    </div>
    <GameRow {games} />
</section>
{/if}

<style>
    .sub { font-size: 0.72rem; opacity: 0.4; }
</style>
