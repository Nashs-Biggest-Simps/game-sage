<script>
	import GameRecommendationSection from '$lib/components/game-cards/GameRecommendationSection.svelte'
	import { db } from '$lib/data'
	import { Algorithm } from '$lib/algorithm'
	import { buildGenreWeights, buildLibraryGames, filterNonOwnedCards, genreNames } from '$lib/suggestions'
	import { onDestroy } from 'svelte'

	const MIN_ROW_ITEMS = 5
	const ROW_LIMIT = 12

	let loadingBuy = $state(false)
	let buyRetryKey = $state('')
	let buyTimer = null

	let buyItems = $derived($db?.cache?.suggestions?.buy?.items ?? [])
	let trending = $derived($db?.cache?.trending?.items ?? [])
	let ownedSet = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(id => String(id))))
	let hasSession = $derived(!!$db?.user?.uid && !!$db?.steamID)
	let libraryDetails = $derived($db?.cache?.library?.details ?? {})
	let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
	let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
	let hideMatureContent = $derived($db?.prefs?.suggestions?.hideMatureContent ?? false)
	let detailCount = $derived(Object.keys($db?.cache?.library?.details ?? {}).length)
	let libraryFetchedAt = $derived($db?.cache?.library?.fetchedAt ?? 0)
	let recentFetchedAt = $derived($db?.cache?.recentlyPlayed?.fetchedAt ?? 0)
	let friendsFetchedAt = $derived($db?.cache?.friends?.fetchedAt ?? 0)
	let trendingFetchedAt = $derived($db?.cache?.trending?.fetchedAt ?? 0)

	let libraryGames = $derived(buildLibraryGames(libraryDetails, libraryPlaytime, blacklist))
	let genreWeights = $derived(buildGenreWeights(libraryGames))
	let mostPlayedEntry = $derived([...libraryGames].sort((a, b) => b.playtime - a.playtime)[0] ?? null)
	let mostPlayedGame = $derived(mostPlayedEntry?.game ?? null)
	let mostPlayedGenres = $derived(genreNames(mostPlayedGame))
	let topGenre = $derived([...genreWeights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)

	let aiCandidates = $derived(filterNonOwnedCards(
		buyItems
			.filter(item => item.source === 'ai' || !item.source)
			.map(({ appid, name, thumbnail }) => ({
				appid,
				name,
				thumbnail,
				playtime_forever: 0,
				source: 'ai',
			})),
		ownedSet,
		{ hideMature: hideMatureContent, details: libraryDetails },
	))

	let localBuyCandidates = $derived(filterNonOwnedCards(
		buyItems
			.filter(item => item.source && item.source !== 'ai')
			.map(({ appid, name, thumbnail, reason }) => ({
				appid,
				name,
				thumbnail,
				playtime_forever: 0,
				reason,
				source: 'local',
			})),
		ownedSet,
		{ hideMature: hideMatureContent, details: libraryDetails },
	))

	let trendingCandidates = $derived(filterNonOwnedCards(
		trending.map(({ appid, name, thumbnail, tag }) => ({
			appid,
			name,
			thumbnail,
			playtime_forever: 0,
			reason:
				tag === 'top' ? 'Top seller on Steam'
				: tag === 'sale' ? 'On sale on Steam'
				: tag === 'new' ? 'New on Steam'
				: 'Trending on Steam',
			source: 'local',
		})),
		ownedSet,
		{ hideMature: hideMatureContent, details: libraryDetails },
	))

	let aiStoreGames = $derived(aiCandidates.slice(0, ROW_LIMIT))
	let similarGames = $derived(buildContextLane(aiCandidates, mostPlayedGenres, aiStoreGames).slice(0, ROW_LIMIT))
	let genreGames = $derived(buildContextLane(aiCandidates, topGenre ? [topGenre] : [], [...aiStoreGames, ...similarGames]).slice(0, ROW_LIMIT))
	let interestGames = $derived(uniqueStoreGames([...localBuyCandidates, ...trendingCandidates, ...aiCandidates])
		.filter(game => !new Set([...aiStoreGames, ...similarGames, ...genreGames].map(item => String(item.appid))).has(String(game.appid)))
		.slice(0, ROW_LIMIT)
	)
	let buyGhostCount = $derived(Math.max(MIN_ROW_ITEMS - aiStoreGames.length, 0))
	let similarGhostCount = $derived(Math.max(MIN_ROW_ITEMS - similarGames.length, 0))
	let genreGhostCount = $derived(Math.max(MIN_ROW_ITEMS - genreGames.length, 0))
	let interestGhostCount = $derived(Math.max(MIN_ROW_ITEMS - interestGames.length, 0))
	let buySourceKey = $derived(`${hasSession}:${detailCount}:${libraryFetchedAt}:${recentFetchedAt}:${friendsFetchedAt}:${trendingFetchedAt}:${aiStoreGames.length}:${buyItems.length}`)

	function uniqueStoreGames(items) {
		const seen = new Set()

		return items.filter(item => {
			const key = String(item?.appid ?? '')
			if (!key || seen.has(key)) return false
			seen.add(key)
			return true
		})
	}

	function normalizedHaystack(game) {
		const cached = libraryDetails?.[game?.appid]?.data
		const genres = (cached?.genres ?? []).map(genre => genre.description).join(' ')
		return `${game?.name ?? ''} ${game?.reason ?? ''} ${genres}`.toLowerCase()
	}

	function matchByTerms(candidates, terms, excluded = []) {
		const blocked = new Set(excluded.map(game => String(game?.appid)))
		const normalizedTerms = terms
			.map(term => String(term).trim().toLowerCase())
			.filter(Boolean)

		if (!normalizedTerms.length) return []

		return candidates
			.filter(game => !blocked.has(String(game.appid)))
			.map(game => {
				const haystack = normalizedHaystack(game)
				const score = normalizedTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)

				return { ...game, _matchScore: score }
			})
			.filter(game => game._matchScore > 0)
			.sort((a, b) => b._matchScore - a._matchScore || a.name.localeCompare(b.name))
	}

	function buildContextLane(candidates, terms, excluded = []) {
		const blocked = new Set(excluded.map(game => String(game?.appid)))
		const matches = matchByTerms(candidates, terms, excluded)
		const matchIds = new Set(matches.map(game => String(game.appid)))
		const fallback = candidates.filter(game => (
			!blocked.has(String(game.appid)) &&
			!matchIds.has(String(game.appid))
		))

		return uniqueStoreGames([...matches, ...fallback])
	}

	async function requestBuySuggestions() {
		loadingBuy = true

		try {
			await new Algorithm().getBuySuggestions()
		}
		catch (error) {
			console.warn('AI store suggestions failed', error)
		}
		finally {
			loadingBuy = false
		}
	}

	$effect(() => {
		if (!hasSession || loadingBuy || aiCandidates.length >= MIN_ROW_ITEMS) return
		if (!libraryFetchedAt || (!detailCount && !recentFetchedAt && !friendsFetchedAt && !trendingFetchedAt)) return
		if (buySourceKey === buyRetryKey) return

		buyRetryKey = buySourceKey
		if (buyTimer) clearTimeout(buyTimer)
		buyTimer = setTimeout(requestBuySuggestions, detailCount ? 220 : 0)
	})

	onDestroy(() => {
		clearTimeout(buyTimer)
	})
</script>

<GameRecommendationSection
	games={aiStoreGames}
	icon="fa-solid fa-store"
	title="AI Store Picks"
	subtitle="unowned games selected by GameSage AI"
	badgeLabel={loadingBuy ? 'Thinking' : 'AI Suggestions'}
	badgeIcon={loadingBuy ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-robot'}
	badgeVariant="buy"
	loading={loadingBuy}
	skeletonCount={MIN_ROW_ITEMS}
	ghostCount={buyGhostCount}
/>

{#if similarGames.length || loadingBuy}
	<GameRecommendationSection
		games={similarGames}
		icon="fa-solid fa-link"
		title={mostPlayedGame?.name ? `Games Similar to ${mostPlayedGame.name}` : 'Games Similar to Your Favorites'}
		subtitle="unowned AI picks anchored to your most-played game"
		badgeLabel="AI Suggestions"
		badgeIcon="fa-solid fa-robot"
		badgeVariant="buy"
		loading={loadingBuy && !similarGames.length}
		skeletonCount={MIN_ROW_ITEMS}
		ghostCount={similarGhostCount}
	/>
{/if}

{#if genreGames.length || loadingBuy}
	<GameRecommendationSection
		games={genreGames}
		icon="fa-solid fa-tags"
		title={topGenre ? `More ${topGenre} Games` : 'More Games in Your Top Genres'}
		subtitle="unowned AI picks aligned with your strongest genre"
		badgeLabel="AI Suggestions"
		badgeIcon="fa-solid fa-robot"
		badgeVariant="buy"
		loading={loadingBuy && !genreGames.length}
		skeletonCount={MIN_ROW_ITEMS}
		ghostCount={genreGhostCount}
	/>
{/if}

{#if interestGames.length || loadingBuy}
	<GameRecommendationSection
		games={interestGames}
		icon="fa-solid fa-lightbulb"
		title="You May Be Interested In"
		subtitle="unowned discoveries from Steam trends and local signals"
		loading={loadingBuy && !interestGames.length}
		skeletonCount={MIN_ROW_ITEMS}
		ghostCount={interestGhostCount}
	/>
{/if}
