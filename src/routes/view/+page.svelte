<script>
	import { page }    from '$app/state'
	import { get } from 'svelte/store'
	import { db }      from '$lib/data'
	import { steamAPI } from '$lib/steam'
	import { fetchGameDetail, resolveThumbnail } from '$lib/cache'
	import ScreenshotModal from '$lib/components/view/ScreenshotModal.svelte'
	import ViewHero from '$lib/components/view/ViewHero.svelte'
	import ViewMainColumn from '$lib/components/view/ViewMainColumn.svelte'
	import ViewSidebar from '$lib/components/view/ViewSidebar.svelte'
	import ViewSkeleton from '$lib/components/view/ViewSkeleton.svelte'
	import '$lib/components/view/view.css'

	let appid = $derived(page.url.searchParams.get('id'))

	let cachedGame  = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
	let fetchedGame = $state(null)
	let game        = $derived(fetchedGame ?? cachedGame)
	let loadingGame = $state(true)

	let hltb         = $state(null)
	let news         = $state([])
	let achievements = $state(null)
	let globalPcts   = $state(null)
	let loadingAch   = $state(true)
	let friends      = $derived($db?.cache?.friends?.data ?? [])

	const VIEW_TTL = {
		hltb:         7 * 24 * 60 * 60 * 1000,
		news:         6 * 60 * 60 * 1000,
		achievements: 15 * 60 * 1000,
		globalPcts:   7 * 24 * 60 * 60 * 1000,
	}

	function isFresh(entry, ttl) {
		return !!entry?.fetchedAt && (Date.now() - entry.fetchedAt) < ttl
	}

	function readViewCache(id, key, ttl) {
		const entry = get(db)?.cache?.view?.[id]?.[key] ?? null
		return isFresh(entry, ttl) ? entry.data : null
	}

	function writeViewCache(id, key, data) {
		db.update(state => {
			state.cache ??= {}
			state.cache.view ??= {}
			state.cache.view[id] ??= {}
			state.cache.view[id][key] = { data, fetchedAt: Date.now() }
			return state
		})
	}

	let myPlaytime = $derived($db?.cache?.library?.playtime?.[appid] ?? 0)
	let myHours    = $derived(Math.round(myPlaytime / 60))
	let isOwned    = $derived(appid in ($db?.cache?.library?.playtime ?? {}))

		let screenshots    = $derived(game?.screenshots?.slice(0, 12) ?? [])
		let movies         = $derived(game?.movies?.filter(m => m.mp4)?.slice(0, 3) ?? [])
		let price          = $derived(game?.price_overview?.final_formatted ?? (game?.is_free ? 'Free' : null))
		let discount       = $derived(game?.price_overview?.discount_percent ?? 0)
		let origPrice      = $derived(game?.price_overview?.initial_formatted ?? null)
		let storeUrl       = $derived(`https://store.steampowered.com/app/${appid}`)
		let genres         = $derived(game?.genres?.map(g => g.description) ?? [])
		let categories     = $derived(game?.categories?.slice(0, 6)?.map(c => c.description) ?? [])
		let platformNames  = $derived(
			Object.entries(game?.platforms ?? {})
				.filter(([, supported]) => supported)
				.map(([platform]) => titleCase(platform))
		)
		let supportedLanguages = $derived(game?.supported_languages ?? [])
		let friendsInGame  = $derived(friends.filter(f => f.gameid && String(f.gameid) === String(appid)))
		let criticScore    = $derived(game?.metacritic?.score ?? game?.metacritic_score ?? null)
		let criticUrl      = $derived(game?.metacritic?.url ?? null)
		let reviewTotal    = $derived(game?.recommendations?.total ?? null)
		let mediaCount     = $derived(screenshots.length + movies.length)
		let websiteHref    = $derived(normalizeWebsiteUrl(game?.website))
		let releaseLabel   = $derived(() => {
			const date = game?.release_date?.date?.trim?.() ?? ''
			if (!date) return null
			return game?.release_date?.coming_soon ? `Coming ${date}` : date
		})
		let controllerSupportLabel = $derived(() => {
			const support = String(game?.controller_support ?? '').trim().toLowerCase()
			if (!support) return null
			if (support === 'full') return 'Full controller support'
			if (support === 'partial') return 'Partial controller support'
			return titleCase(support)
		})
		let ageRating = $derived(() => {
			const age = Number(game?.required_age ?? 0)
			return Number.isFinite(age) && age > 0 ? `${age}+` : null
		})
		let heroMetaItems = $derived(() => {
			const items = []
			if (game?.developers?.[0]) items.push(game.developers[0])
			if (game?.publishers?.[0] && game.publishers[0] !== game?.developers?.[0]) items.push(game.publishers[0])
			if (releaseLabel()) items.push(releaseLabel())
			return items
		})
		let gameDetailRows = $derived(() => {
			const rows = []
			if (game?.type) rows.push({ label: 'Type', value: titleCase(game.type) })
			if (releaseLabel()) rows.push({
				label: game?.release_date?.coming_soon ? 'Launch' : 'Released',
				value: releaseLabel(),
			})
			if (game?.developers?.length) rows.push({ label: 'Developer', value: game.developers.join(', ') })
			if (game?.publishers?.length) rows.push({ label: 'Publisher', value: game.publishers.join(', ') })
			if (platformNames.length) rows.push({ label: 'Platforms', value: platformNames.join(', ') })
			if (totalAch > 0) rows.push({ label: 'Achievements', value: `${totalAch} total` })
			if (reviewTotal) rows.push({ label: 'Reviews', value: `${reviewTotal.toLocaleString()} reviews` })
			if (game?.dlc_count > 0) rows.push({ label: 'DLC', value: `${game.dlc_count} items` })
			if (screenshots.length > 0) rows.push({ label: 'Screenshots', value: `${screenshots.length} available` })
			if (movies.length > 0) rows.push({ label: 'Trailers', value: `${movies.length} available` })
			return rows
		})
		let supportRows = $derived(() => {
			const rows = []
			if (controllerSupportLabel()) rows.push({ label: 'Controller', value: controllerSupportLabel() })
			if (ageRating()) rows.push({ label: 'Age Gate', value: ageRating() })
			if (supportedLanguages.length) rows.push({
				label: 'Languages',
				value: supportedLanguages.slice(0, 2).join(', ') + (supportedLanguages.length > 2 ? ` +${supportedLanguages.length - 2}` : ''),
			})
			return rows
		})

		function fallbackHeroImages(id) {
			return [
				`https://cdn.akamai.steamstatic.com/steam/apps/${id}/library_hero.jpg`,
				`https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
			]
		}

		// Hero image with JS preload fallback chain
		let heroIdx    = $state(0)
		let heroCandidates = $derived(
			[...new Set([
				...fallbackHeroImages(appid ?? '0'),
				game?.hero_image,
				cachedGame?.hero_image,
				game?.thumbnail,
				cachedGame?.thumbnail,
				appid ? resolveThumbnail(appid) : null,
			].filter(Boolean))]
		)
		let heroSrc    = $derived(heroCandidates[heroIdx] ?? null)
		let heroFailed = $derived(heroIdx >= heroCandidates.length)
		$effect(() => {
			appid
			game?.thumbnail
			cachedGame?.thumbnail
			heroIdx = 0
		})

	let heroLoaded = $state(false)
	$effect(() => {
		if (!heroSrc || heroFailed) { heroLoaded = false; return }
		heroLoaded = false
		const img = new Image()
		img.onload  = () => { heroLoaded = true }
		img.onerror = () => { heroIdx++; heroLoaded = false }
		img.src = heroSrc
	})

	// Screenshot modal
	let modalIdx = $state(null)
		let modalSrc = $derived(modalIdx !== null ? (screenshots[modalIdx]?.path_full ?? null) : null)
		let screenshotLeftFade = $state(0)
		function openModal(idx) { modalIdx = idx }
		function closeModal()   { modalIdx = null }
		function modalPrev()    { if (modalIdx > 0) modalIdx-- }
		function modalNext()    { if (modalIdx < screenshots.length - 1) modalIdx++ }

		function handleScreenshotScroll(e) {
			const pivotPoint = 100
			screenshotLeftFade = Math.min(e.target.scrollLeft / pivotPoint, 1)
		}

	function handleKeydown(e) {
		if (modalIdx === null) return
		if (e.key === 'Escape')     closeModal()
		if (e.key === 'ArrowLeft')  modalPrev()
		if (e.key === 'ArrowRight') modalNext()
	}

	// Achievements
	let totalAch  = $derived(achievements?.achievements?.length ?? 0)
	let earnedAch = $derived(achievements?.achievements?.filter(a => a.achieved)?.length ?? 0)
		let achPct    = $derived(totalAch > 0 ? Math.round((earnedAch / totalAch) * 100) : 0)

		let activeViewLoad = 0
		let lastLoadedAppid = null

		$effect(() => {
			const id = appid
			if (!id) {
				lastLoadedAppid = null
				activeViewLoad++
				fetchedGame = null
				loadingGame = false
				hltb = null
				news = []
				achievements = null
				globalPcts = null
				loadingAch = false
				return
			}

			if (id === lastLoadedAppid) return
			lastLoadedAppid = id

			const viewLoadId = ++activeViewLoad
			const state = get(db)
			const currentCachedGame = state?.cache?.library?.details?.[id]?.data ?? null
			const owned = Object.prototype.hasOwnProperty.call(state?.cache?.library?.playtime ?? {}, id)
			const needsRichDetail = (
				!Array.isArray(currentCachedGame?.screenshots) ||
				!Array.isArray(currentCachedGame?.movies) ||
				currentCachedGame?.platforms == null ||
				currentCachedGame?.supported_languages === undefined ||
				currentCachedGame?.website === undefined ||
				currentCachedGame?.required_age === undefined ||
				currentCachedGame?.controller_support === undefined ||
				currentCachedGame?.dlc_count === undefined ||
				currentCachedGame?.hero_image === undefined
			)

			fetchedGame = null
			loadingGame = true
			hltb = null
			news = []
			achievements = null
			globalPcts = null
			loadingAch = owned

			if (!currentCachedGame || needsRichDetail) {
				fetchGameDetail(id).then(game => {
					if (viewLoadId !== activeViewLoad) return
					fetchedGame = game
					loadingGame = false
				})
			} else {
				loadingGame = false
			}

			const cachedHltb = readViewCache(id, 'hltb', VIEW_TTL.hltb)
			if (cachedHltb !== null) {
				hltb = cachedHltb
			} else {
				steamAPI.howLongToBeat(id, ret => {
					if (viewLoadId !== activeViewLoad) return
					hltb = ret ?? null
					writeViewCache(id, 'hltb', hltb)
				})
			}

			const cachedNews = readViewCache(id, 'news', VIEW_TTL.news)
			if (cachedNews !== null) {
				news = cachedNews
			} else {
				steamAPI.getNewsForApp(id, ret => {
					if (viewLoadId !== activeViewLoad) return
					news = ret?.appnews?.newsitems?.slice(0, 4) ?? []
					writeViewCache(id, 'news', news)
				})
			}

			if (!owned) {
				loadingAch = false
				return
			}

			const cachedAchievements = readViewCache(id, 'achievements', VIEW_TTL.achievements)
			if (cachedAchievements !== null) {
				achievements = cachedAchievements
				loadingAch = false
			} else {
				steamAPI.getPlayerAchievements(id, ret => {
					if (viewLoadId !== activeViewLoad) return
					achievements = ret?.playerstats ?? null
					loadingAch = false
					writeViewCache(id, 'achievements', achievements)
				})
			}

			const cachedGlobalPcts = readViewCache(id, 'globalPcts', VIEW_TTL.globalPcts)
			if (cachedGlobalPcts !== null) {
				globalPcts = cachedGlobalPcts
			} else {
				steamAPI.getGlobalAchievementPercentages(id, ret => {
					if (viewLoadId !== activeViewLoad) return
					globalPcts = ret ?? null
					writeViewCache(id, 'globalPcts', globalPcts)
				})
			}
		})

	function hltbFmt(val) {
		if (!val) return null
		const h = Math.trunc(val)
		const m = Math.round((val % 1) * 60)
		return m > 0 ? `${h}h ${m}m` : `${h}h`
	}

	let hltbPrimary = $derived(hltbFmt(hltb?.mainStory ?? hltb?.mainStoryWithExtras ?? hltb?.completionist))

	function newsDate(unix) {
		return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}

		function stripHtml(html) {
			return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)
		}

		function titleCase(value = '') {
			return String(value)
				.split(/[\s_-]+/)
				.filter(Boolean)
				.map(word => word[0].toUpperCase() + word.slice(1))
				.join(' ')
		}

		function normalizeWebsiteUrl(value) {
			const url = String(value ?? '').trim()
			if (!url) return null
			return /^https?:\/\//i.test(url) ? url : `https://${url}`
		}
</script>

<svelte:window onkeydown={handleKeydown} />

<ScreenshotModal
	{modalIdx}
	{modalSrc}
	{screenshots}
	{closeModal}
	{modalPrev}
	{modalNext}
/>

<div class="view-page">
	{#if loadingGame && !game}
		<ViewSkeleton />
	{:else if game}
		<ViewHero
			{game}
			{heroLoaded}
			{heroSrc}
			{genres}
			heroMetaItems={heroMetaItems()}
			{isOwned}
			{myHours}
			{totalAch}
			{earnedAch}
			{achPct}
			{criticScore}
			{hltbPrimary}
			{friendsInGame}
			{mediaCount}
		/>

		<div class="content-grid">
			<ViewMainColumn
				{game}
				{movies}
				{screenshots}
				{screenshotLeftFade}
				{loadingAch}
				{achievements}
				{globalPcts}
				{news}
				{openModal}
				{handleScreenshotScroll}
				{newsDate}
				{stripHtml}
			/>

			<ViewSidebar
				{appid}
				{game}
				{isOwned}
				{storeUrl}
				{websiteHref}
				{price}
				{discount}
				{origPrice}
				{myHours}
				{friendsInGame}
				{hltb}
				{hltbFmt}
				{criticScore}
				{criticUrl}
				supportRows={supportRows()}
				{categories}
				gameDetailRows={gameDetailRows()}
				{genres}
			/>
		</div>
	{:else}
		<div class="not-found">
			<i class="fa-solid fa-triangle-exclamation"></i>
			<span>Could not load game data</span>
		</div>
	{/if}
</div>
