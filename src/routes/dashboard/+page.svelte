<script>
	import { db }                  from '$lib/data'
	import { goto }                from '$app/navigation'
	import { resolve }             from '$app/paths'
	import {
		dashboardRightColumnItems,
		normalizeDashboardContentLayout,
		normalizeDashboardLayout,
	} from '$lib/dashboardLayout'
	// Hero
	import ContinuePlayingHero     from '$lib/components/hero/ContinuePlayingHero.svelte'
	// Row sections — ordered by user value / recency / discovery
	import RecentlyPlayed          from '$lib/components/dashboard-rows/RecentlyPlayed.svelte'
	import AISuggestions           from '$lib/components/dashboard-rows/AISuggestions.svelte'
	import LibrarySuggestions      from '$lib/components/dashboard-rows/LibrarySuggestions.svelte'
	import ChangeOfPace            from '$lib/components/dashboard-rows/ChangeOfPace.svelte'
	import ThisWeekRow             from '$lib/components/dashboard-rows/ThisWeekRow.svelte'
	import MostPlayed              from '$lib/components/dashboard-rows/MostPlayed.svelte'
	import FriendGroupFavorites    from '$lib/components/dashboard-rows/FriendGroupFavorites.svelte'
	import FriendNotOwned          from '$lib/components/dashboard-rows/FriendNotOwned.svelte'
	import TrendingForYou          from '$lib/components/dashboard-rows/TrendingForYou.svelte'
	import GameNewsPanel           from '$lib/components/game-cards/GameNewsPanel.svelte'
	// Right panel modules
	import DashboardBriefing       from '$lib/components/dashboard-panels/DashboardBriefing.svelte'
	import QuickStats              from '$lib/components/dashboard-panels/QuickStats.svelte'
	import FriendInsights          from '$lib/components/dashboard-panels/FriendInsights.svelte'
	import GenreSpotlightPanel     from '$lib/components/dashboard-panels/GenreSpotlightPanel.svelte'
	import RecentSessions          from '$lib/components/dashboard-panels/RecentSessions.svelte'
	import PopularWithFriends      from '$lib/components/dashboard-panels/PopularWithFriends.svelte'

	let mostRecentGame = $derived($db?.cache?.recentlyPlayed?.data[0] ?? null)
	let name           = $derived($db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? null)
	let pfp            = $derived($db?.cache?.user?.data?.avatarfull  ?? $db?.user?.photoURL    ?? null)
	let dashboardContentLayout = $derived(normalizeDashboardContentLayout($db?.prefs?.dashboard?.contentLayout))
	let leftContentModules = $derived(dashboardContentLayout.left.filter(module => module.enabled))
	let rightColumnItems = $derived(
		dashboardRightColumnItems(
			dashboardContentLayout,
			normalizeDashboardLayout($db?.prefs?.dashboard?.layout),
			$db?.prefs?.dashboard?.rightOrder
		).filter(entry => entry.item.enabled)
	)
	const profileHref  = resolve('/profile')

	function openProfile(event) {
		event.preventDefault()
		goto(profileHref)
	}
</script>

<div class="page">
	<div class="page-header">
		<div class="page-title">Dashboard</div>
		<a href={profileHref} class="profile-btn" onclick={openProfile}>
			{#if pfp}
				<img src={pfp} alt="" class="profile-img" />
			{:else}
				<div class="profile-icon"><i class="fa-solid fa-user"></i></div>
			{/if}
			{#if name}
				<span>{name}</span>
			{/if}
		</a>
	</div>

	<div class="dashboard">
		<ContinuePlayingHero />

		<div class="main-grid">
			<div class="left-col">
				{#each leftContentModules as module (module.id)}
					{#if module.id === 'recentlyPlayed'}
						<RecentlyPlayed />
					{:else if module.id === 'aiStorePicks'}
						<AISuggestions />
					{:else if module.id === 'libraryBacklog'}
						<LibrarySuggestions />
					{:else if module.id === 'changeOfPace'}
						<ChangeOfPace />
					{:else if module.id === 'thisWeek'}
						<ThisWeekRow />
					{:else if module.id === 'mostPlayed'}
						<MostPlayed />
					{:else if module.id === 'friendCircle'}
						<FriendGroupFavorites />
					{:else if module.id === 'friendsUnowned'}
						<FriendNotOwned />
					{:else if module.id === 'steamCharts'}
						<TrendingForYou />
					{:else if module.id === 'gameNews'}
						<GameNewsPanel game={mostRecentGame ?? null} />
					{/if}
				{/each}
			</div>

			<aside class="right-col">
				{#each rightColumnItems as entry (entry.key)}
					{#if entry.type === 'content' && entry.item.id === 'recentlyPlayed'}
						<RecentlyPlayed />
					{:else if entry.type === 'content' && entry.item.id === 'aiStorePicks'}
						<AISuggestions />
					{:else if entry.type === 'content' && entry.item.id === 'libraryBacklog'}
						<LibrarySuggestions />
					{:else if entry.type === 'content' && entry.item.id === 'changeOfPace'}
						<ChangeOfPace />
					{:else if entry.type === 'content' && entry.item.id === 'thisWeek'}
						<ThisWeekRow />
					{:else if entry.type === 'content' && entry.item.id === 'mostPlayed'}
						<MostPlayed />
					{:else if entry.type === 'content' && entry.item.id === 'friendCircle'}
						<FriendGroupFavorites />
					{:else if entry.type === 'content' && entry.item.id === 'friendsUnowned'}
						<FriendNotOwned />
					{:else if entry.type === 'content' && entry.item.id === 'steamCharts'}
						<TrendingForYou />
					{:else if entry.type === 'content' && entry.item.id === 'gameNews'}
						<GameNewsPanel game={mostRecentGame ?? null} />
					{:else if entry.type === 'panel' && entry.item.id === 'recommendedActions'}
						<DashboardBriefing />
					{:else if entry.type === 'panel' && entry.item.id === 'librarySnapshot'}
						<QuickStats />
					{:else if entry.type === 'panel' && entry.item.id === 'liveFriendPulse'}
						<FriendInsights />
					{:else if entry.type === 'panel' && entry.item.id === 'unplayedGenre'}
						<GenreSpotlightPanel />
					{:else if entry.type === 'panel' && entry.item.id === 'recentSessions'}
						<RecentSessions compact />
					{:else if entry.type === 'panel' && entry.item.id === 'friendActivityPulse'}
						<PopularWithFriends />
					{/if}
				{/each}
			</aside>
		</div>
	</div>
</div>

<style>
	.page {
		display: grid;
		gap: 1.2rem;
	}

	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 2.4rem;
	}

	.main-grid {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(20rem, 3fr);
		gap: 2.4rem;
		align-items: start;
	}

	.left-col {
		display: flex;
		flex-direction: column;
		gap: 2.4rem;
	}

	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}

	.profile-btn {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.35rem 0.7rem 0.35rem 0.35rem;
		margin-left: 0.5rem;
		border-radius: 100vh;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		transition: background 150ms;
		outline: solid 1pt transparent;
	}

	.profile-btn:hover {
		background: var(--l1);
		outline-color: var(--l3);
	}

	.profile-img {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-icon {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		background: var(--l3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
	}
</style>
