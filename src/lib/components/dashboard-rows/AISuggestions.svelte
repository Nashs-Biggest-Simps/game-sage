<script>
    import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
    import { db } from '$lib/data'
    import { Algorithm } from '$lib/algorithm'
    import { onMount } from 'svelte'

    const MIN_ROW_ITEMS = 8

    let loadingPlay = $state(false)
    let loadingBuy  = $state(false)

    let playItems = $derived($db?.cache?.suggestions?.play?.items ?? [])
    let buyItems  = $derived($db?.cache?.suggestions?.buy?.items ?? [])

    let libraryGames = $derived(playItems.map(({ game, reason }) => ({
        appid:            game.steam_appid,
        name:             game.name,
        thumbnail:        game.thumbnail ?? null,
        playtime_forever: 0,
        reason,
    })))

    let buyGames = $derived(buyItems.map(({ appid, name, thumbnail, reason }) => ({
        appid,
        name,
        thumbnail,
        playtime_forever: 0,
        reason,
    })))

    onMount(() => {
        const algorithm = new Algorithm()

        if (playItems.length < MIN_ROW_ITEMS) {
            loadingPlay = true
            algorithm.getPlaySuggestions().finally(() => { loadingPlay = false })
        }

        if (buyItems.length < MIN_ROW_ITEMS) {
            loadingBuy = true
            algorithm.getBuySuggestions().finally(() => { loadingBuy = false })
        }
    })
</script>

{#if libraryGames.length > 0}
<GameRecommendationSection
    games={libraryGames}
    icon="fa-solid fa-wand-magic-sparkles"
    title="Picked From Your Library"
    badgeLabel="GameSage AI"
    badgeIcon="fa-solid fa-robot"
/>
{:else if loadingPlay}
<GameRecommendationSection
    games={[]}
    icon="fa-solid fa-wand-magic-sparkles"
    title="Picked From Your Library"
    badgeLabel="Thinking"
    badgeIcon="fa-solid fa-circle-notch fa-spin"
    loading={true}
    skeletonCount={MIN_ROW_ITEMS}
/>
{/if}

{#if buyGames.length > 0}
<GameRecommendationSection
    games={buyGames}
    icon="fa-solid fa-store"
    title="Picked For You"
    badgeLabel="GameSage AI"
    badgeIcon="fa-solid fa-robot"
    badgeVariant="buy"
/>
{:else if loadingBuy}
<GameRecommendationSection
    games={[]}
    icon="fa-solid fa-store"
    title="Picked For You"
    badgeLabel="Thinking"
    badgeIcon="fa-solid fa-circle-notch fa-spin"
    badgeVariant="buy"
    loading={true}
    skeletonCount={MIN_ROW_ITEMS}
/>
{/if}
