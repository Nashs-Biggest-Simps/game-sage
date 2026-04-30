<!-- created by Aaron Meche -->
<script>
	import { db } from '$lib/data'
	import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { filterOwnedCards } from '$lib/suggestions'

	const MIN_ROW_ITEMS = 5

	let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
	let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
	let games = $derived(filterOwnedCards(recentGames, ownedSet))
	let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<!--  -->

<GameRecommendationSection
	{games}
	icon="fa-solid fa-clock-rotate-left"
	title="Recently Played From Your Library"
	subtitle="owned games from your latest Steam activity"
	skeletonCount={MIN_ROW_ITEMS}
	{ghostCount}
/>

<!--  -->

<style>

</style>
