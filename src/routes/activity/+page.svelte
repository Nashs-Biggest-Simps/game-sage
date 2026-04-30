<script>
	import { onMount, onDestroy } from 'svelte'
	import { db }                from '$lib/data'
	import { refreshFriends }    from '$lib/cache'
	import { normalizeActivityLayout } from '$lib/dashboardLayout'
	import ActivityHero          from '$lib/components/hero/ActivityHero.svelte'

	// Left column
	import RecentSessions        from '$lib/components/dashboard-panels/RecentSessions.svelte'
	import TopGamesPlayed        from '$lib/components/dashboard-panels/TopGamesPlayed.svelte'
	import JoinFriends           from '$lib/components/dashboard-panels/JoinFriends.svelte'
	import GenreBreakdown        from '$lib/components/dashboard-panels/GenreBreakdown.svelte'
	import FriendGameFeed        from '$lib/components/dashboard-panels/FriendGameFeed.svelte'

	// Right column
	import FriendInsights        from '$lib/components/dashboard-panels/FriendInsights.svelte'
	import FriendActivityRecency from '$lib/components/dashboard-panels/FriendActivityRecency.svelte'
	import LibraryProfile        from '$lib/components/dashboard-panels/LibraryProfile.svelte'
	import FriendsList           from '$lib/components/dashboard-panels/FriendsList.svelte'
	import AdvancedFriendInsights from '$lib/components/dashboard-panels/AdvancedFriendInsights.svelte'

	let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
	let weekHours   = $derived(
		recentGames.reduce((sum, g) => sum + Math.round((g.playtime_2weeks ?? 0) / 60), 0)
	)
	let activityLayout = $derived(normalizeActivityLayout($db?.prefs?.activity?.layout))
	let leftModules = $derived(activityLayout.left.filter(module => module.enabled))
	let rightModules = $derived(activityLayout.right.filter(module => module.enabled))

	let refreshInterval

	onMount(() => {
		refreshFriends()
		refreshInterval = setInterval(refreshFriends, 60_000)
	})

	onDestroy(() => clearInterval(refreshInterval))
</script>

<div class="page">
	<div class="page-header">
		<div class="page-title">Activity</div>
		<div class="stat-pills">
			{#if recentGames.length > 0}
				<div class="pill">
					<i class="fa-solid fa-gamepad"></i>
					{recentGames.length} game{recentGames.length !== 1 ? 's' : ''} this week
				</div>
			{/if}
			{#if weekHours > 0}
				<div class="pill accent">
					<i class="fa-solid fa-clock"></i>
					{weekHours}h this week
				</div>
			{/if}
		</div>
	</div>

	<ActivityHero />

	<div class="page-content">
		<div class="left">
			{#each leftModules as module (module.id)}
				{#if module.id === 'recentSessions'}
					<RecentSessions />
				{:else if module.id === 'topGamesPlayed'}
					<TopGamesPlayed />
				{:else if module.id === 'joinFriends'}
					<JoinFriends />
				{:else if module.id === 'genreBreakdown'}
					<GenreBreakdown />
				{:else if module.id === 'friendsInGame'}
					<FriendGameFeed />
				{:else if module.id === 'liveFriendPulse'}
					<FriendInsights />
				{:else if module.id === 'lastSeen'}
					<FriendActivityRecency />
				{:else if module.id === 'libraryProfile'}
					<LibraryProfile />
				{:else if module.id === 'friendsList'}
					<FriendsList />
				{:else if module.id === 'advancedFriendInsights'}
					<AdvancedFriendInsights />
				{/if}
			{/each}
		</div>
		<div class="right">
			{#each rightModules as module (module.id)}
				{#if module.id === 'recentSessions'}
					<RecentSessions compact />
				{:else if module.id === 'topGamesPlayed'}
					<TopGamesPlayed compact />
				{:else if module.id === 'joinFriends'}
					<JoinFriends compact />
				{:else if module.id === 'genreBreakdown'}
					<GenreBreakdown compact />
				{:else if module.id === 'friendsInGame'}
					<FriendGameFeed compact />
				{:else if module.id === 'liveFriendPulse'}
					<FriendInsights />
				{:else if module.id === 'lastSeen'}
					<FriendActivityRecency />
				{:else if module.id === 'libraryProfile'}
					<LibraryProfile />
				{:else if module.id === 'friendsList'}
					<FriendsList />
				{:else if module.id === 'advancedFriendInsights'}
					<AdvancedFriendInsights />
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.page { display: grid; gap: 1.2rem; }

	.page-content {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: 1.2rem;
		align-items: start;
	}

	.left, .right {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	@media (max-width: 900px) {
		.page-content {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
