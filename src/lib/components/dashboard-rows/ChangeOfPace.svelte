<script>
	import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { db } from '$lib/data'
	import {
		buildChangeOfPaceSuggestions,
		buildLibraryGames,
		buildLocalLibrarySuggestions,
	} from '$lib/suggestions'

	const MIN_ROW_ITEMS = 5

	let hasSteamID = $derived(!!$db?.steamID)
	let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
	let excludedGenres = $derived($db?.prefs?.genres?.excluded ?? [])
	let libraryDetails = $derived($db?.cache?.library?.details ?? {})
	let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
	let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))

	let libraryGames = $derived(buildLibraryGames(libraryDetails, libraryPlaytime, blacklist))
	let matchedSuggestions = $derived(buildLocalLibrarySuggestions(libraryGames, preferredGenres, excludedGenres))
	let paceSuggestions = $derived(buildChangeOfPaceSuggestions(libraryGames, preferredGenres, excludedGenres, matchedSuggestions))

	let games = $derived(paceSuggestions.map(({ game, reason }) => ({
		appid: game.steam_appid,
		name: game.name,
		thumbnail: game.thumbnail ?? null,
		playtime_forever: libraryPlaytime[game.steam_appid] ?? 0,
		reason,
	})))
	let ghostCount = $derived(Math.max(MIN_ROW_ITEMS - games.length, 0))
</script>

<GameRecommendationSection
	{games}
	icon="fa-solid fa-compass"
	title="Library Wildcards"
	subtitle="owned games outside your usual rotation"
	badgeLabel="Variety"
	badgeIcon="fa-solid fa-shuffle"
	loading={hasSteamID && !games.length && !Object.keys(libraryDetails).length}
	skeletonCount={MIN_ROW_ITEMS}
	{ghostCount}
/>
