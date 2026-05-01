<script>
	//
	// Search Page
	// created by Aaron Meche
	//
	import { db } from '$lib/data'
	import { steamAPI } from '$lib/steam'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		SEARCH_GENRE_OPTIONS,
		buildOwnedSearchResults,
	} from '$lib/components/search/searchPageUtils'
	import "$lib/components/search/search.css"
	import SearchHeader from '$lib/components/search/SearchHeader.svelte'
	import SearchControls from '$lib/components/search/SearchControls.svelte'
	import SearchResults from '$lib/components/search/SearchResults.svelte'

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
	let ownedAppIdSet  = $derived(new Set(ownedAppIds.map(id => Number(id))))

	let ownedResults = $derived(buildOwnedSearchResults({
		query,
		appIds: ownedAppIds,
		details: libraryDetails,
		playtime: libraryPlaytime,
		genreFilter,
	}))

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
		genreOptions={SEARCH_GENRE_OPTIONS}
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
		{ownedAppIdSet}
		openGame={openGame}
	/>
</div>
