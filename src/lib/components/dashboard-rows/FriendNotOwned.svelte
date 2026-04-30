<script>
	import GameRecommendationSection         from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { db }                 from '$lib/data'
	import { buildFriendNotOwned } from '$lib/suggestions'

	const MIN_ROW_ITEMS = 5
	const ROW_CACHE_VERSION = 3

	let byHour   = $derived($db?.cache?.friendPopularity ?? {})
	let friends  = $derived($db?.cache?.friends?.data ?? [])
	let friendsFetchedAt = $derived($db?.cache?.friends?.fetchedAt ?? 0)
	let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
	let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
	let cachedGames = $derived(
		$db?.cache?.rows?.friendNotOwned?.version === ROW_CACHE_VERSION
			? ($db?.cache?.rows?.friendNotOwned?.items ?? null)
			: null
	)
	let rowFetchedAt = $derived($db?.cache?.rows?.friendNotOwned?.fetchedAt ?? 0)
	let games    = $derived(cachedGames ?? buildFriendNotOwned(byHour, ownedSet, friends))
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
		icon="fa-solid fa-cart-shopping"
		title="Friends' Unowned Picks"
		subtitle="recurring in your circle, not in your library"
		{loading}
		skeletonCount={MIN_ROW_ITEMS}
		{ghostCount}
	/>
{/if}
