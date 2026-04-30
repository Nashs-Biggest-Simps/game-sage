<script>
	import GameRecommendationSection         from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { db }                 from '$lib/data'
	import { buildFriendNotOwned, filterNonOwnedCards } from '$lib/suggestions'

	const MIN_ROW_ITEMS = 5
	const ROW_CACHE_VERSION = 3

	let byHour   = $derived($db?.cache?.friendPopularity ?? {})
	let friends  = $derived($db?.cache?.friends?.data ?? [])
	let friendsFetchedAt = $derived($db?.cache?.friends?.fetchedAt ?? 0)
	let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
	let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
	let hideMatureContent = $derived($db?.prefs?.suggestions?.hideMatureContent ?? false)
	let details = $derived($db?.cache?.library?.details ?? {})
	let cachedGames = $derived(
		$db?.cache?.rows?.friendNotOwned?.version === ROW_CACHE_VERSION
			? ($db?.cache?.rows?.friendNotOwned?.items ?? null)
			: null
	)
	let rowFetchedAt = $derived($db?.cache?.rows?.friendNotOwned?.fetchedAt ?? 0)
	let games    = $derived(filterNonOwnedCards(cachedGames ?? buildFriendNotOwned(byHour, ownedSet, friends), ownedSet, { hideMature: hideMatureContent, details }))
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
		title="Friends Play, You Don't Own"
		subtitle="recurring in your circle and not in your library"
		{loading}
		skeletonCount={MIN_ROW_ITEMS}
		{ghostCount}
	/>
{/if}
