<!-- created by Aaron Meche -->
<script>
	import { db } from '$lib/data'
	import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'

	const MIN_ROW_ITEMS = 5

	let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
	let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - recentGames.length, 0))
</script>

<!--  -->

<GameRecommendationSection
	games={recentGames}
	icon="fa-solid fa-clock-rotate-left"
	title="Recently Played"
	subtitle="latest games from your Steam activity"
	skeletonCount={MIN_ROW_ITEMS}
	{ghostCount}
/>

<!--  -->

<style>

</style>
