<script>
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { db } from '$lib/data'
	import { buildLibraryGames, buildLocalLibrarySuggestions } from '$lib/suggestions'

	let recent = $derived($db?.cache?.recentlyPlayed?.data ?? [])
	let friends = $derived($db?.cache?.friends?.data ?? [])
	let details = $derived($db?.cache?.library?.details ?? {})
	let playtime = $derived($db?.cache?.library?.playtime ?? {})
	let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
	let excludedGenres = $derived($db?.prefs?.genres?.excluded ?? [])
	let blacklist = $derived(new Set(($db?.cache?.library?.blacklist ?? []).map(String)))
	let owned = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))
	let buySuggestions = $derived($db?.cache?.suggestions?.buy?.items ?? [])
	let trending = $derived($db?.cache?.trending?.items ?? [])

	let latestGame = $derived(recent[0] ?? null)
	let ownedFriendGame = $derived(findOwnedFriendGame(friends, owned, details))
	let unownedFriendGame = $derived(findUnownedFriendGame(friends, owned))
	let aiStoreGame = $derived(buySuggestions.find(game => !owned.has(String(game?.appid))) ?? null)
	let chartGame = $derived(trending.find(game => !owned.has(String(game?.appid))) ?? null)
	let backlogGame = $derived(
		buildLocalLibrarySuggestions(
			buildLibraryGames(details, playtime, blacklist),
			preferredGenres,
			excludedGenres,
		)[0]?.game ?? null
	)
	let actions = $derived([
		ownedFriendGame ? {
			icon: 'fa-solid fa-user-group',
			label: 'Join friends',
			title: ownedFriendGame.name,
			meta: `${ownedFriendGame.count} friend${ownedFriendGame.count !== 1 ? 's' : ''} playing now`,
			appid: ownedFriendGame.appid,
			accent: true,
		} : null,
		latestGame ? {
			icon: 'fa-solid fa-clock-rotate-left',
			label: 'Continue',
			title: latestGame.name,
			meta: `${Math.round((latestGame.playtime_2weeks ?? 0) / 60)}h this week`,
			appid: latestGame.appid,
		} : null,
		backlogGame ? {
			icon: 'fa-solid fa-box-archive',
			label: 'Backlog pick',
			title: backlogGame.name,
			meta: 'Owned and matched to your taste',
			appid: backlogGame.steam_appid,
		} : null,
		aiStoreGame ? {
			icon: 'fa-solid fa-wand-magic-sparkles',
			label: 'AI store pick',
			title: aiStoreGame.name,
			meta: aiStoreGame.reason ?? 'Recommended to buy or wishlist',
			appid: aiStoreGame.appid,
		} : null,
		unownedFriendGame ? {
			icon: 'fa-solid fa-cart-shopping',
			label: 'Friends are playing',
			title: unownedFriendGame.name,
			meta: `${unownedFriendGame.count} friend${unownedFriendGame.count !== 1 ? 's' : ''} playing · not owned`,
			appid: unownedFriendGame.appid,
		} : null,
		chartGame ? {
			icon: 'fa-solid fa-chart-line',
			label: 'Steam chart pick',
			title: chartGame.name,
			meta: chartGame.tag === 'sale' ? 'On sale now' : chartGame.tag === 'new' ? 'New release' : 'Trending on Steam',
			appid: chartGame.appid,
		} : null,
	].filter(Boolean).filter(uniqueByAppid).slice(0, 6))

	function findOwnedFriendGame(items, ownedSet, libraryDetails) {
		const map = new Map()

		for (const friend of items) {
			const key = String(friend.gameid ?? '')
			if (!key || !ownedSet.has(key)) continue

			const entry = map.get(key) ?? {
				appid: Number(key),
				name: libraryDetails[key]?.data?.name ?? friend.gameextrainfo ?? `App ${key}`,
				count: 0,
			}

			entry.count += 1
			map.set(key, entry)
		}

		return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] ?? null
	}

	function findUnownedFriendGame(items, ownedSet) {
		const map = new Map()

		for (const friend of items) {
			const key = String(friend.gameid ?? '')
			if (!key || ownedSet.has(key)) continue

			const entry = map.get(key) ?? {
				appid: Number(key),
				name: friend.gameextrainfo ?? `App ${key}`,
				count: 0,
			}

			entry.count += 1
			map.set(key, entry)
		}

		return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0] ?? null
	}

	function uniqueByAppid(action, index, list) {
		return list.findIndex(item => String(item.appid) === String(action.appid)) === index
	}

	function openGame(appid) {
		if (!appid) return
		goto(resolve(`/view?id=${appid}`))
	}
</script>

{#if actions.length}
	<section class="panel briefing-panel">
		<div class="panel-title">
			<i class="fa-solid fa-compass"></i>
			Recommended Actions
		</div>

		<div class="briefing-list">
			{#each actions as action (action.label)}
				<button class:accent={action.accent} class="briefing-action" onclick={() => openGame(action.appid)}>
					<div class="action-icon">
						<i class={action.icon}></i>
					</div>
					<div class="action-copy">
						<div class="action-label">{action.label}</div>
						<div class="action-title">{action.title}</div>
						<div class="action-meta">{action.meta}</div>
					</div>
					<i class="fa-solid fa-chevron-right action-arrow"></i>
				</button>
			{/each}
		</div>
	</section>
{/if}

<style>
	.briefing-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.briefing-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
	}

	.briefing-action {
		width: 100%;
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr) 1rem;
		gap: 0.7rem;
		align-items: center;
		min-height: 4.1rem;
		box-sizing: border-box;
		padding: 0.6rem 0.75rem;
		border: 0;
		border-radius: 0.7rem;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 120ms, outline-color 120ms;
		outline: solid 1pt transparent;
	}

	.briefing-action:hover {
		background: var(--l1);
		outline-color: var(--l3);
	}

	.briefing-action.accent {
		background: hsl(212, 70%, 42%, 0.16);
		outline-color: hsl(212, 74%, 58%, 0.24);
	}

	.action-icon {
		width: 2rem;
		height: 2rem;
		display: grid;
		place-items: center;
		align-self: center;
		color: var(--bright-accent);
	}

	.action-icon i {
		font-size: 1.25rem;
	}

	.action-copy {
		min-width: 0;
		align-self: center;
	}

	.action-label {
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.42;
	}

	.action-title {
		margin-top: 0.08rem;
		font-size: 0.86rem;
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.action-meta {
		margin-top: 0.06rem;
		font-size: 0.7rem;
		opacity: 0.46;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.action-arrow {
		justify-self: center;
		font-size: 0.7rem;
		opacity: 0.35;
	}
</style>
