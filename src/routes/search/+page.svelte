<script>
	import { db } from '$lib/data'
	import { steamAPI } from '$lib/steam'
	import { resolveThumbnail } from '$lib/cache'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import SearchHeader from '$lib/components/search/SearchHeader.svelte'
	import SearchControls from '$lib/components/search/SearchControls.svelte'
	import SearchResults from '$lib/components/search/SearchResults.svelte'
	import '$lib/components/search/search.css'

	const GENRE_OPTIONS = [
		'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
		'Sports', 'Racing', 'Puzzle', 'Horror', 'Indie',
		'Casual', 'Shooter', 'Multiplayer', 'Open World', 'Survival',
	]

	let query        = $state('')
	let mode         = $state('owned')   // 'owned' | 'store'
	let genreFilter  = $state('')
	let storeResults = $state([])
	let storeLoading = $state(false)
	let searched     = $state(false)
	let submittedQuery = $state('')
	let lastStoreQuery = $state('')
	let searchToken = 0

	let libraryDetails = $derived($db?.cache?.library?.details ?? {})
	let libraryPlaytime = $derived($db?.cache?.library?.playtime ?? {})
	let ownedAppIds    = $derived($db?.cache?.library?.appIdList ?? [])

	let ownedResults = $derived(() => {
		if (!query.trim()) return []
		const q = query.trim().toLowerCase()
		return ownedAppIds
			.map(id => ({ appid: id, detail: libraryDetails[id]?.data ?? null, playtime: libraryPlaytime[id] ?? 0 }))
			.filter(g => {
				if (!g.detail?.name) return false
				if (!g.detail.name.toLowerCase().includes(q)) return false
				if (genreFilter && !g.detail.genres?.some(gen => gen.description === genreFilter)) return false
				return true
			})
			.slice(0, 60)
	})

	function searchSteamStore(term) {
		const normalized = term.trim()
		if (!normalized || lastStoreQuery === normalized) return

		const token = ++searchToken
		lastStoreQuery = normalized
		storeLoading = true
		storeResults = []

		steamAPI.searchStore(normalized, (res) => {
			if (token !== searchToken) return
			storeResults = res?.items ?? []
			storeLoading = false
		})
	}

	function runSearch() {
		const term = query.trim()
		if (!term) return

		submittedQuery = term
		searched = true

		if (mode === 'store') {
			searchSteamStore(term)
		} else if (ownedResults().length === 0) {
			mode = 'store'
			searchSteamStore(term)
		}
	}

	function formatPrice(item) {
		if (!item.price) return 'Free'
		if (item.price.final === 0) return 'Free'
		return `$${(item.price.final / 100).toFixed(2)}`
	}

	function discount(item) {
		return item.price?.discount_percent > 0 ? item.price.discount_percent : null
	}

	function hoursLabel(minutes) {
		const h = Math.round(minutes / 60)
		if (h === 0) return 'Unplayed'
		if (h >= 1000) return `${(h / 1000).toFixed(1)}k h`
		return `${h.toLocaleString()}h`
	}

	function ownedThumbnail(detail, appid) {
		return detail?.thumbnail ?? detail?.header_image ?? resolveThumbnail(appid)
	}

	function storeThumbnail(item) {
		return item.large_capsule_image
			?? item.header_image
			?? item.tiny_image
			?? resolveThumbnail(item.id)
	}

	function resetSearch() {
		query = ''
		submittedQuery = ''
		searched = false
		storeResults = []
		storeLoading = false
		lastStoreQuery = ''
		searchToken++
	}

	function activateOwnedMode() {
		mode = 'owned'
		searched = false
	}

	function activateStoreMode() {
		mode = 'store'
		if (!query.trim()) return
		submittedQuery = query.trim()
		searched = true
		searchSteamStore(query)
	}

	function openGame(appid) {
		goto(resolve(`/view?id=${appid}`))
	}

	$effect(() => {
		const term = query.trim()
		if (term !== submittedQuery) searched = false
	})

	let activeResults = $derived(mode === 'owned' ? ownedResults() : storeResults)
	let isEmpty = $derived(searched && !storeLoading && activeResults.length === 0)
</script>

<div class="page">
	<SearchHeader ownedCount={ownedAppIds.length} />

	<SearchControls
		bind:query
		bind:mode
		bind:genreFilter
		genreOptions={GENRE_OPTIONS}
		{searched}
		{storeLoading}
		activeCount={activeResults.length}
		{runSearch}
		{resetSearch}
		{activateOwnedMode}
		{activateStoreMode}
	/>

	<SearchResults
		{query}
		{submittedQuery}
		{searched}
		{storeLoading}
		{isEmpty}
		{mode}
		ownedResults={ownedResults()}
		{storeResults}
		{ownedAppIds}
		{hoursLabel}
		{ownedThumbnail}
		{storeThumbnail}
		{formatPrice}
		{discount}
		openGame={openGame}
		{resolveThumbnail}
	/>
</div>
