<script>
	import GameRecommendationSection            from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { db }                    from '$lib/data'
	import { buildFriendGroupFavorites } from '$lib/suggestions'

	const MIN_ROW_ITEMS = 5
	const ROW_CACHE_VERSION = 3

	let byHour = $derived($db?.cache?.friendPopularity ?? {})
	let friends = $derived($db?.cache?.friends?.data ?? [])
	let friendsFetchedAt = $derived($db?.cache?.friends?.fetchedAt ?? 0)
	let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
	let cachedGames = $derived(
		$db?.cache?.rows?.friendGroupFavorites?.version === ROW_CACHE_VERSION
			? ($db?.cache?.rows?.friendGroupFavorites?.items ?? null)
			: null
	)
	let rowFetchedAt = $derived($db?.cache?.rows?.friendGroupFavorites?.fetchedAt ?? 0)
	let games  = $derived(cachedGames ?? buildFriendGroupFavorites(byHour, friends))
	let loading = $derived(
		!games.length &&
		!rowFetchedAt &&
		!friendsFetchedAt &&
		!Object.keys(byHour).length &&
		friendsStatus?.state === 'checking'
	)
	let showRow = $derived(loading || games.length > 0)
	let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

{#if showRow}
	<GameRecommendationSection
		{games}
		icon="fa-solid fa-fire-flame-curved"
		title="Friend Circle Momentum"
		subtitle={Object.keys(byHour).length ? 'computed from recurring friend activity' : 'building friend trend history'}
		{loading}
		skeletonCount={MIN_ROW_ITEMS}
		{ghostCount}
	/>
{/if}
