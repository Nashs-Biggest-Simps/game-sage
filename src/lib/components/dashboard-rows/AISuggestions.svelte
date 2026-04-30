<script>
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db } from '$lib/data'
    import { Algorithm } from '$lib/algorithm'
    import { onDestroy } from 'svelte'

    const MIN_ROW_ITEMS = 5

    let loadingPlay = $state(false)
    let loadingBuy  = $state(false)
    let playRetryKey = $state('')
    let buyRetryKey  = $state('')
    let playTimer = null
    let buyTimer = null

    let playItems = $derived($db?.cache?.suggestions?.play?.items ?? [])
    let buyItems  = $derived($db?.cache?.suggestions?.buy?.items ?? [])
    let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(id => String(id))))
    let hasSession = $derived(!!$db?.user?.uid && !!$db?.steamID)
    let detailCount = $derived(Object.keys($db?.cache?.library?.details ?? {}).length)
    let libraryFetchedAt = $derived($db?.cache?.library?.fetchedAt ?? 0)
    let recentFetchedAt = $derived($db?.cache?.recentlyPlayed?.fetchedAt ?? 0)
    let friendsFetchedAt = $derived($db?.cache?.friends?.fetchedAt ?? 0)
    let trendingFetchedAt = $derived($db?.cache?.trending?.fetchedAt ?? 0)

    let libraryGames = $derived(playItems
        .filter(({ game }) => ownedSet.has(String(game?.steam_appid)))
        .map(({ game, reason }) => ({
        appid:            game.steam_appid,
        name:             game.name,
        thumbnail:        game.thumbnail ?? null,
        playtime_forever: 0,
        reason,
    })))

    let buyGames = $derived(buyItems
        .filter(({ appid }) => !ownedSet.has(String(appid)))
        .map(({ appid, name, thumbnail, reason }) => ({
        appid,
        name,
        thumbnail,
        playtime_forever: 0,
        reason,
    })))

    let playGhostCount = $derived(Math.max(MIN_ROW_ITEMS - libraryGames.length, 0))
    let buyGhostCount = $derived(Math.max(MIN_ROW_ITEMS - buyGames.length, 0))
    let playSourceKey = $derived(`${hasSession}:${detailCount}:${libraryFetchedAt}:${recentFetchedAt}:${libraryGames.length}:${playItems.length}`)
    let buySourceKey = $derived(`${hasSession}:${detailCount}:${libraryFetchedAt}:${recentFetchedAt}:${friendsFetchedAt}:${trendingFetchedAt}:${buyGames.length}:${buyItems.length}`)

    async function requestSuggestions(type) {
        const algorithm = new Algorithm()

        if (type === 'play') {
            loadingPlay = true
            await algorithm.getPlaySuggestions().finally(() => { loadingPlay = false })
            return
        }

        loadingBuy = true
        await algorithm.getBuySuggestions().finally(() => { loadingBuy = false })
    }

    $effect(() => {
        if (!hasSession || loadingPlay || libraryGames.length >= MIN_ROW_ITEMS) return
        if (!libraryFetchedAt || (!detailCount && !recentFetchedAt)) return
        if (playSourceKey === playRetryKey) return

        playRetryKey = playSourceKey
        if (playTimer) clearTimeout(playTimer)
        playTimer = setTimeout(() => requestSuggestions('play'), detailCount ? 180 : 0)
    })

    $effect(() => {
        if (!hasSession || loadingBuy || buyGames.length >= MIN_ROW_ITEMS) return
        if (!libraryFetchedAt || (!detailCount && !recentFetchedAt && !friendsFetchedAt && !trendingFetchedAt)) return
        if (buySourceKey === buyRetryKey) return

        buyRetryKey = buySourceKey
        if (buyTimer) clearTimeout(buyTimer)
        buyTimer = setTimeout(() => requestSuggestions('buy'), detailCount ? 220 : 0)
    })

    onDestroy(() => {
        clearTimeout(playTimer)
        clearTimeout(buyTimer)
    })
</script>

<GameRecommendationSection
    games={libraryGames}
    icon="fa-solid fa-wand-magic-sparkles"
    title="Picked From Your Library"
    badgeLabel={loadingPlay ? 'Thinking' : 'GameSage AI'}
    badgeIcon={loadingPlay ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-robot'}
    loading={loadingPlay}
    skeletonCount={MIN_ROW_ITEMS}
    ghostCount={playGhostCount}
/>

<GameRecommendationSection
    games={buyGames}
    icon="fa-solid fa-store"
    title="Picked For You"
    badgeLabel={loadingBuy ? 'Thinking' : 'GameSage AI'}
    badgeIcon={loadingBuy ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-robot'}
    badgeVariant="buy"
    loading={loadingBuy}
    skeletonCount={MIN_ROW_ITEMS}
    ghostCount={buyGhostCount}
/>
