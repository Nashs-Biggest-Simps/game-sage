<script>
	// 
	// View Page
	// created by Aaron Meche
	//
	import { page } from "$app/state";
	import { get } from "svelte/store";
	import { db } from "$lib/data";
	import {
		cachedViewGame,
		loadRichGameDetail,
		loadViewAchievements,
		loadViewGlobalAchievementPercentages,
		loadViewHltb,
		loadViewNews,
		ownsViewGame,
	} from "$lib/components/view/viewDataLoaders";
	import ViewContent from "$lib/components/view/ViewContent.svelte";
	import ViewSkeleton from "$lib/components/view/ViewSkeleton.svelte";
	import "$lib/components/view/view.css";

	let appid = $derived(page.url.searchParams.get("id"));

	let cachedGame = $derived(
		$db?.cache?.library?.details?.[appid]?.data ?? null,
	);
	let fetchedGame = $state(null);
	let game = $derived(fetchedGame ?? cachedGame);
	let loadingGame = $state(true);

	let hltb = $state(null);
	let news = $state([]);
	let achievements = $state(null);
	let globalPcts = $state(null);
	let loadingAch = $state(true);

	let activeViewLoad = 0;
	let lastLoadedAppid = null;

	function resetViewState({ achievementsLoading = false } = {}) {
		fetchedGame = null;
		hltb = null;
		news = [];
		achievements = null;
		globalPcts = null;
		loadingAch = achievementsLoading;
	}

	function applyViewLoad(viewLoadId, update) {
		if (viewLoadId === activeViewLoad) update();
	}

	function loadGame(id, currentCachedGame, viewLoadId) {
		loadRichGameDetail(id, currentCachedGame).then((loadedGame) => {
			applyViewLoad(viewLoadId, () => {
				if (loadedGame !== undefined) fetchedGame = loadedGame;
				loadingGame = false;
			});
		});
	}

	function loadExtras(id, viewLoadId, owned) {
		loadViewHltb(id).then(data => applyViewLoad(viewLoadId, () => hltb = data));
		loadViewNews(id).then(data => applyViewLoad(viewLoadId, () => news = data));

		if (!owned) {
			loadingAch = false;
			return;
		}

		loadViewAchievements(id).then(data => applyViewLoad(viewLoadId, () => {
			achievements = data;
			loadingAch = false;
		}));
		loadViewGlobalAchievementPercentages(id).then(data => applyViewLoad(viewLoadId, () => globalPcts = data));
	}

	$effect(() => {
		const id = appid;
		if (!id) {
			lastLoadedAppid = null;
			activeViewLoad++;
			resetViewState();
			loadingGame = false;
			return;
		}

		if (id === lastLoadedAppid) return;
		lastLoadedAppid = id;

		const viewLoadId = ++activeViewLoad;
		const state = get(db);
		const currentCachedGame = cachedViewGame(state, id);
		const owned = ownsViewGame(state, id);

		resetViewState({ achievementsLoading: owned });
		loadingGame = true;

		loadGame(id, currentCachedGame, viewLoadId);
		loadExtras(id, viewLoadId, owned);
	});
</script>

<div class="view-page">
	{#if loadingGame && !game}
		<ViewSkeleton />
	{:else if game}
		<ViewContent
			{appid}
			{game}
			{cachedGame}
			{hltb}
			{news}
			{achievements}
			{globalPcts}
			{loadingAch}
		/>
	{:else}
		<div class="not-found">
		<i class="fa-solid fa-triangle-exclamation"></i>
		<span>Could not load game data</span>
		</div>
	{/if}
</div>
