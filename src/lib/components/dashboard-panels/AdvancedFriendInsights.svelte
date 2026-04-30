<script>
	import { db } from '$lib/data'

	let friends = $derived($db?.cache?.friends?.data ?? [])
	let owned = $derived(new Set(($db?.cache?.library?.appIdList ?? []).map(String)))

	let liveFriends = $derived(friends.filter(friend => friend.gameid))
	let onlineFriends = $derived(friends.filter(friend => friend.gameid || friend.personastate > 0))
	let gameClusters = $derived(buildCurrentGameClusters(liveFriends, owned))
	let insights = $derived(buildInsights(friends, liveFriends, onlineFriends, gameClusters))
	let show = $derived(friends.length > 0)

	function buildCurrentGameClusters(live, ownedSet) {
		const map = new Map()

		for (const friend of live) {
			const key = String(friend.gameid)
			const cluster = map.get(key) ?? {
				appid: Number(friend.gameid),
				name: friend.gameextrainfo ?? `App ${friend.gameid}`,
				owned: ownedSet.has(key),
				friends: [],
			}

			cluster.friends.push(friend)
			map.set(key, cluster)
		}

		return [...map.values()].sort((a, b) => {
			if (b.friends.length !== a.friends.length) return b.friends.length - a.friends.length
			if (a.owned !== b.owned) return a.owned ? -1 : 1
			return a.name.localeCompare(b.name)
		})
	}

	function buildInsights(allFriends, live, online, clusters) {
		const liveOwned = live.filter(friend => owned.has(String(friend.gameid))).length
		const liveUnowned = Math.max(live.length - liveOwned, 0)
		const onlineIdle = online.length - live.length
		const activeRate = allFriends.length ? Math.round((online.length / allFriends.length) * 100) : 0
		const ownershipRate = live.length ? Math.round((liveOwned / live.length) * 100) : 0
		const largestCluster = clusters[0] ?? null

		return {
			activeRate,
			liveOwned,
			liveUnowned,
			onlineIdle,
			ownershipRate,
			largestCluster,
			sameGameClusters: clusters.filter(cluster => cluster.friends.length > 1).length,
			topClusters: clusters.slice(0, 5),
		}
	}
</script>

{#if show}
	<section class="panel advanced-panel">
		<div class="panel-header">
			<div>
				<div class="panel-title">
					<i class="fa-solid fa-network-wired"></i>
					Advanced Friend Insights
				</div>
				<div class="row-subtitle">current friend state, live game clusters, ownership overlap</div>
			</div>
			<span class="pill accent">{onlineFriends.length} active now</span>
		</div>

		<div class="insight-grid">
			<div class="metric-card primary">
				<div class="metric-value">{insights.activeRate}%</div>
				<div class="metric-label">friend active rate</div>
				<div class="metric-note">{onlineFriends.length} of {friends.length} online or in-game</div>
			</div>
			<div class="metric-card">
				<div class="metric-value">{liveFriends.length}</div>
				<div class="metric-label">playing now</div>
				<div class="metric-note">{insights.onlineIdle} online but not in-game</div>
			</div>
			<div class="metric-card">
				<div class="metric-value">{insights.sameGameClusters}</div>
				<div class="metric-label">same-game clusters</div>
				<div class="metric-note">games with 2+ friends currently playing</div>
			</div>
			<div class="metric-card">
				<div class="metric-value">{insights.ownershipRate}%</div>
				<div class="metric-label">live overlap owned</div>
				<div class="metric-note">{insights.liveOwned} owned, {insights.liveUnowned} not owned</div>
			</div>
		</div>

		<div class="signal-layout">
			<div class="signal-card">
				<div class="signal-label">Best join opportunity</div>
				<div class="signal-main">{insights.largestCluster?.name ?? 'No friends in-game'}</div>
				<div class="signal-note">
					{#if insights.largestCluster}
						{insights.largestCluster.friends.length} friend{insights.largestCluster.friends.length !== 1 ? 's' : ''} playing now · {insights.largestCluster.owned ? 'in your library' : 'not owned'}.
					{:else}
						No live game cluster is available from the current friend snapshot.
					{/if}
				</div>
			</div>

			<div class="signal-card">
				<div class="signal-label">Ownership signal</div>
				<div class="signal-main">{insights.liveOwned} playable now</div>
				<div class="signal-note">Counts only friends currently in games you already own.</div>
			</div>
		</div>

		{#if insights.topClusters.length}
			<div class="trend-table">
				{#each insights.topClusters as cluster, index (cluster.appid)}
					<div class="trend-row">
						<div class="trend-rank">#{index + 1}</div>
						<div class="trend-info">
							<div class="trend-name">{cluster.name}</div>
							<div class="trend-meta">{cluster.friends.map(friend => friend.personaname).filter(Boolean).slice(0, 3).join(', ')}</div>
						</div>
						<div class="trend-score">{cluster.friends.length}</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.advanced-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.98rem;
		font-weight: 800;
	}

	.panel-title i {
		color: var(--bright-accent);
	}

	.row-subtitle {
		margin-top: 0.22rem;
		font-size: 0.74rem;
		opacity: 0.48;
	}

	.insight-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.metric-card,
	.signal-card {
		border-radius: 0.8rem;
		background: hsl(212, 24%, 12%, 0.42);
		outline: solid 1pt hsl(212, 38%, 36%, 0.42);
		padding: 0.85rem;
		backdrop-filter: blur(18px) saturate(1.18);
		-webkit-backdrop-filter: blur(18px) saturate(1.18);
		box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
	}

	.metric-card.primary {
		background: hsl(212, 70%, 42%, 0.24);
		outline-color: hsl(212, 74%, 58%, 0.34);
	}

	.metric-value {
		font-size: 1.55rem;
		font-weight: 900;
		line-height: 1;
		color: var(--bright-accent);
	}

	.metric-label {
		margin-top: 0.3rem;
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.5;
	}

	.metric-note,
	.signal-note,
	.trend-meta {
		margin-top: 0.18rem;
		font-size: 0.72rem;
		opacity: 0.48;
		line-height: 1.35;
	}

	.signal-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.65rem;
	}

	.signal-label {
		font-size: 0.68rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.45;
	}

	.signal-main {
		margin-top: 0.28rem;
		font-size: 1rem;
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trend-table {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
	}

	.trend-row {
		display: grid;
		grid-template-columns: 2.4rem minmax(0, 1fr) 3rem;
		gap: 0.65rem;
		align-items: center;
		padding: 0.52rem 0.65rem;
		border-radius: 0.65rem;
		transition: background 120ms;
	}

	.trend-row:hover {
		background: var(--l1);
	}

	.trend-rank,
	.trend-score {
		font-size: 0.72rem;
		font-weight: 800;
		opacity: 0.45;
	}

	.trend-name {
		font-size: 0.86rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trend-score {
		text-align: right;
		color: var(--bright-accent);
		opacity: 0.8;
	}

	@media (max-width: 520px) {
		.insight-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
