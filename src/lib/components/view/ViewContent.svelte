<script>
	import { db } from '$lib/data'
	import {
		gameDetailRows,
		heroImageCandidates,
		heroMetaItems,
		hltbFmt,
		newsDate,
		normalizeWebsiteUrl,
		platformNames,
		primaryHltbLabel,
		stripHtml,
		supportRows,
	} from '$lib/components/view/viewPageUtils'
	import ScreenshotModal from '$lib/components/view/ScreenshotModal.svelte'
	import ViewHero from '$lib/components/view/ViewHero.svelte'
	import ViewMainColumn from '$lib/components/view/ViewMainColumn.svelte'
	import ViewSidebar from '$lib/components/view/ViewSidebar.svelte'

	let {
		appid,
		game,
		cachedGame = null,
		hltb = null,
		news = [],
		achievements = null,
		globalPcts = null,
		loadingAch = false,
	} = $props()

	let friends = $derived($db?.cache?.friends?.data ?? [])
	let myPlaytime = $derived($db?.cache?.library?.playtime?.[appid] ?? 0)
	let myHours = $derived(Math.round(myPlaytime / 60))
	let isOwned = $derived(appid in ($db?.cache?.library?.playtime ?? {}))

	let screenshots = $derived(game?.screenshots?.slice(0, 12) ?? [])
	let movies = $derived(game?.movies?.filter(movie => movie.mp4)?.slice(0, 3) ?? [])
	let price = $derived(game?.price_overview?.final_formatted ?? (game?.is_free ? 'Free' : null))
	let discount = $derived(game?.price_overview?.discount_percent ?? 0)
	let origPrice = $derived(game?.price_overview?.initial_formatted ?? null)
	let storeUrl = $derived(`https://store.steampowered.com/app/${appid}`)
	let genres = $derived(game?.genres?.map(genre => genre.description) ?? [])
	let categories = $derived(game?.categories?.slice(0, 6)?.map(category => category.description) ?? [])
	let supportedLanguages = $derived(game?.supported_languages ?? [])
	let friendsInGame = $derived(friends.filter(friend => friend.gameid && String(friend.gameid) === String(appid)))
	let criticScore = $derived(game?.metacritic?.score ?? game?.metacritic_score ?? null)
	let criticUrl = $derived(game?.metacritic?.url ?? null)
	let reviewTotal = $derived(game?.recommendations?.total ?? null)
	let websiteHref = $derived(normalizeWebsiteUrl(game?.website))

	let totalAch = $derived(achievements?.achievements?.length ?? 0)
	let earnedAch = $derived(achievements?.achievements?.filter(achievement => achievement.achieved)?.length ?? 0)
	let achPct = $derived(totalAch > 0 ? Math.round((earnedAch / totalAch) * 100) : 0)
	let mediaCount = $derived(screenshots.length + movies.length)
	let hltbPrimary = $derived(primaryHltbLabel(hltb))
	let platforms = $derived(platformNames(game))

	let heroIdx = $state(0)
	let heroLoaded = $state(false)
	let heroCandidates = $derived(heroImageCandidates({ appid, game, cachedGame }))
	let heroSrc = $derived(heroCandidates[heroIdx] ?? null)
	let heroFailed = $derived(heroIdx >= heroCandidates.length)

	let modalIdx = $state(null)
	let modalSrc = $derived(modalIdx !== null ? (screenshots[modalIdx]?.path_full ?? null) : null)
	let screenshotLeftFade = $state(0)

	$effect(() => {
		appid
		game?.thumbnail
		cachedGame?.thumbnail
		heroIdx = 0
	})

	$effect(() => {
		if (!heroSrc || heroFailed) {
			heroLoaded = false
			return
		}

		heroLoaded = false
		const img = new Image()
		img.onload = () => {
			heroLoaded = true
		}
		img.onerror = () => {
			heroIdx++
			heroLoaded = false
		}
		img.src = heroSrc
	})

	function openModal(idx) {
		modalIdx = idx
	}

	function closeModal() {
		modalIdx = null
	}

	function modalPrev() {
		if (modalIdx > 0) modalIdx--
	}

	function modalNext() {
		if (modalIdx < screenshots.length - 1) modalIdx++
	}

	function handleScreenshotScroll(e) {
		const pivotPoint = 100
		screenshotLeftFade = Math.min(e.target.scrollLeft / pivotPoint, 1)
	}

	function handleKeydown(e) {
		if (modalIdx === null) return
		if (e.key === 'Escape') closeModal()
		if (e.key === 'ArrowLeft') modalPrev()
		if (e.key === 'ArrowRight') modalNext()
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

<ViewHero
	{game}
	{heroLoaded}
	{heroSrc}
	{genres}
	heroMetaItems={heroMetaItems(game)}
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
		supportRows={supportRows(game, supportedLanguages)}
		{categories}
		gameDetailRows={gameDetailRows({
			game,
			platforms,
			totalAchievements: totalAch,
			reviewTotal,
			screenshotCount: screenshots.length,
			movieCount: movies.length,
		})}
		{genres}
	/>
</div>
