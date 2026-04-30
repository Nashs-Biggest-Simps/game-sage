<script>
	import { db } from '$lib/data'

	let recentGames = $derived($db?.cache?.recentlyPlayed?.data ?? [])
	let friends = $derived($db?.cache?.friends?.data ?? [])
	let weekHours = $derived(
		recentGames.reduce((sum, g) => sum + Math.round((g.playtime_2weeks ?? 0) / 60), 0)
	)
	let topRecentGame = $derived(() => [...recentGames]
		.filter(game => (game.playtime_2weeks ?? 0) > 0)
		.sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))[0] ?? null
	)
	let onlineFriends = $derived(friends.filter(friend => friend.gameid || (friend.personastate ?? 0) > 0))
	let inGameFriends = $derived(friends.filter(friend => friend.gameid))
	let playMix = $derived(() => getPlayMix(recentGames))
	let heroSummary = $derived(() => {
		const topGame = topRecentGame()

		if (topGame && inGameFriends.length > 0) {
			return `${topGame.name} is your current playtime anchor, with ${inGameFriends.length} friend${inGameFriends.length === 1 ? '' : 's'} active in game right now.`
		}

		if (topGame) {
			return `${topGame.name} is carrying most of your recent Steam time from the last two weeks.`
		}

		if (inGameFriends.length > 0) {
			return `${inGameFriends.length} friend${inGameFriends.length === 1 ? ' is' : 's are'} in game right now. Recent playtime will fill in after Steam reports new sessions.`
		}

		return 'Recent sessions, top games, and live friend activity will summarize here once Steam data is available.'
	})

	const playMixColors = [
		'hsl(212, 72%, 58%)',
		'hsl(204, 48%, 48%)',
		'hsl(198, 34%, 42%)',
		'hsl(216, 28%, 36%)',
		'hsl(212, 22%, 30%)'
	]

	function gameHours(game) {
		return Math.round((game?.playtime_2weeks ?? 0) / 60)
	}

	function getPlayMix(games) {
		const playable = games
			.filter(game => (game.playtime_2weeks ?? 0) > 0)
			.sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
			.slice(0, 5)
		const total = playable.reduce((sum, game) => sum + (game.playtime_2weeks ?? 0), 0)

		return playable.map((game, index) => ({
			id: game.appid ?? game.name,
			name: game.name,
			hours: gameHours(game),
			pct: total > 0 ? ((game.playtime_2weeks ?? 0) / total) * 100 : 0,
			color: playMixColors[index % playMixColors.length]
		}))
	}

	function playMixGradient(rows) {
		if (!rows.length) return 'conic-gradient(hsl(212, 24%, 18%, 0.72) 0 100%)'

		let cursor = 0
		const segments = rows.map(row => {
			const start = cursor
			cursor += row.pct
			return `${row.color} ${start}% ${cursor}%`
		})

		if (cursor < 100) {
			segments.push(`hsl(212, 24%, 18%, 0.72) ${cursor}% 100%`)
		}

		return `conic-gradient(${segments.join(', ')})`
	}
</script>

<section class="activity-hero">
	<div class="hero-copy">
		<h1>Steam Snapshot</h1>
		<p>{heroSummary()}</p>

		<div class="hero-stats">
			<div class="hero-stat primary">
				<span>{weekHours}</span>
				<small>hours in recent play</small>
			</div>
			<div class="hero-stat">
				<span>{recentGames.length}</span>
				<small>recent game{recentGames.length === 1 ? '' : 's'}</small>
			</div>
			<div class="hero-stat">
				<span>{onlineFriends.length}</span>
				<small>friend{onlineFriends.length === 1 ? '' : 's'} online</small>
			</div>
			<div class="hero-stat">
				<span>{inGameFriends.length}</span>
				<small>currently in game</small>
			</div>
		</div>
	</div>

	<div class="hero-graph" aria-label="Recent play and friend activity graph">
		<div class="mix-card">
			<div class="mix-heading">
				<i class="fa-solid fa-chart-pie"></i>
				Recent play mix
			</div>
			<div class="mix-ring" style={`background: ${playMixGradient(playMix())};`}>
				<div class="mix-core">
					<span>{topRecentGame() ? gameHours(topRecentGame()) : 0}h</span>
					<small>{topRecentGame()?.name ?? 'No recent leader'}</small>
				</div>
			</div>

			<div class="mix-list">
				{#if playMix().length > 0}
					{#each playMix() as item (item.id)}
						<div class="mix-row">
							<div class="mix-meta">
								<span class="dot" style={`background: ${item.color};`}></span>
								<span>{item.name}</span>
							</div>
							<strong>{item.hours}h</strong>
						</div>
					{/each}
				{:else}
					<div class="empty-hero-row">
						<i class="fa-regular fa-circle"></i>
						No recent play mix available
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.activity-hero {
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(22rem, 0.82fr);
		gap: 1rem;
		align-items: stretch;
		padding: 1rem;
		border-radius: 1.15rem;
		background:
			radial-gradient(circle at 16% 10%, hsl(212, 68%, 54%, 0.14), transparent 28rem),
			radial-gradient(circle at 84% 0%, hsl(204, 42%, 34%, 0.14), transparent 24rem),
			hsl(212, 24%, 12%, 0.58);
		outline: solid 1pt hsl(212, 38%, 36%, 0.52);
		backdrop-filter: blur(26px) saturate(1.24);
		-webkit-backdrop-filter: blur(26px) saturate(1.24);
		box-shadow:
			0 18px 52px hsl(0, 0%, 0%, 0.22),
			inset 0 1px 0 hsl(0, 0%, 100%, 0.075);
	}

	.hero-copy {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.hero-copy h1 {
		margin: 0;
		max-width: 38rem;
		font-size: clamp(1.25rem, 1.65vw, 1.8rem);
		line-height: 1.04;
		letter-spacing: -0.035em;
	}

	.hero-copy p {
		max-width: 40rem;
		margin: 0;
		color: hsl(0, 0%, 100%, 0.66);
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.hero-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.55rem;
		margin-top: 0.1rem;
	}

	.hero-stat {
		min-width: 0;
		padding: 0.62rem 0.7rem;
		border-radius: 0.7rem;
		background: hsl(212, 24%, 12%, 0.42);
		outline: solid 1pt hsl(212, 38%, 36%, 0.42);
		backdrop-filter: blur(18px) saturate(1.18);
		-webkit-backdrop-filter: blur(18px) saturate(1.18);
	}

	.hero-stat.primary {
		background: hsl(212, 70%, 42%, 0.24);
		outline-color: hsl(212, 74%, 58%, 0.34);
	}

	.hero-stat span {
		display: block;
		font-size: 1.25rem;
		font-weight: 850;
		line-height: 1;
	}

	.hero-stat small {
		display: block;
		margin-top: 0.22rem;
		font-size: 0.68rem;
		opacity: 0.58;
		line-height: 1.25;
	}

	.hero-graph {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.8rem;
		min-width: 0;
	}

	.mix-card {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.7rem 0.85rem;
		align-items: center;
		padding: 0.8rem;
		border-radius: 0.9rem;
		background: hsl(212, 24%, 12%, 0.42);
		outline: solid 1pt hsl(212, 38%, 36%, 0.42);
		backdrop-filter: blur(18px) saturate(1.18);
		-webkit-backdrop-filter: blur(18px) saturate(1.18);
	}

	.mix-heading {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.58;
	}

	.mix-ring {
		width: 7.6rem;
		aspect-ratio: 1;
		border-radius: 999rem;
		display: grid;
		place-items: center;
		box-shadow:
			0 18px 38px hsl(0, 0%, 0%, 0.28),
			inset 0 0 0 1px hsl(0, 0%, 100%, 0.08);
	}

	.mix-core {
		width: 4.85rem;
		aspect-ratio: 1;
		border-radius: 999rem;
		display: grid;
		place-items: center;
		align-content: center;
		gap: 0.25rem;
		padding: 0.7rem;
		text-align: center;
		background: hsl(212, 24%, 9%, 0.88);
		outline: solid 1pt hsl(212, 38%, 36%, 0.34);
	}

	.mix-core span {
		font-size: 1.25rem;
		font-weight: 850;
		line-height: 1;
	}

	.mix-core small {
		max-width: 5.4rem;
		font-size: 0.58rem;
		line-height: 1.2;
		opacity: 0.58;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.mix-list {
		display: grid;
		gap: 0.42rem;
		min-width: 0;
	}

	.mix-row,
	.empty-hero-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		min-width: 0;
		font-size: 0.73rem;
	}

	.mix-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.mix-meta span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.78;
	}

	.dot {
		flex: 0 0 auto;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999rem;
	}

	.mix-row strong {
		flex: 0 0 auto;
		font-size: 0.72rem;
		color: var(--bright-accent);
	}

	.empty-hero-row {
		justify-content: flex-start;
		opacity: 0.5;
	}

	@media (max-width: 1080px) {
		.activity-hero {
			grid-template-columns: minmax(0, 1fr);
		}

		.hero-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.activity-hero {
			padding: 1rem;
		}

		.mix-card {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
		}

		.mix-list {
			width: 100%;
		}

		.hero-stats {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
