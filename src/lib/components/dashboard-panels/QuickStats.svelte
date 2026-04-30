<script>
	import { db } from '$lib/data'

	let playtime = $derived($db?.cache?.library?.playtime ?? {})
	let recent = $derived($db?.cache?.recentlyPlayed?.data ?? [])

	let totalGames = $derived(Object.keys(playtime).length)
	let totalHours = $derived(Math.round(Object.values(playtime).reduce((a, b) => a + b, 0) / 60))
	let weekHours = $derived(Math.round(recent.reduce((a, g) => a + (g.playtime_2weeks || 0), 0) / 60))
	let neverPlayed = $derived(Object.values(playtime).filter(m => m === 0).length)
	let pctPlayed = $derived(totalGames > 0 ? Math.round(((totalGames - neverPlayed) / totalGames) * 100) : 0)
</script>

<div class="panel">
	<h3 class="panel-title">
		<i class="fa-solid fa-chart-simple"></i>
		Library Snapshot
	</h3>

	<div class="stats-grid">
		<div class="stat primary">
			<div class="value">{weekHours}</div>
			<div class="label">Hours This Week</div>
		</div>
		<div class="stat">
			<div class="value">{totalGames.toLocaleString()}</div>
			<div class="label">Owned Games</div>
		</div>
		<div class="stat">
			<div class="value">{totalHours.toLocaleString()}</div>
			<div class="label">Lifetime Hours</div>
		</div>
		<div class="stat">
			<div class="value">{neverPlayed.toLocaleString()}</div>
			<div class="label">Backlog</div>
		</div>
	</div>

	{#if totalGames > 0}
		<div class="bar-wrap">
			<div class="bar-label">
				<span>Library explored</span>
				<span class="pct">{pctPlayed}%</span>
			</div>
			<div class="bar-track">
				<div class="bar-fill" style="width: {pctPlayed}%"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.stat {
		padding: 0.9rem 1rem;
		background: var(--l1);
		border-radius: 0.8rem;
		outline: solid 1pt var(--l3);
	}

	.stat.primary {
		background: var(--la1);
		outline-color: var(--la3);
	}

	.value {
		font-size: 1.7rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.stat.primary .value { color: var(--bright-accent); }

	.label {
		font-size: 0.7rem;
		opacity: 0.55;
		margin-top: 0.25rem;
		font-weight: 500;
	}

	.bar-wrap {
		margin-top: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.bar-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.72rem;
		opacity: 0.55;
	}

	.pct { font-weight: 700; opacity: 1; color: var(--bright-accent); }

	.bar-track {
		height: 0.35rem;
		background: var(--l2);
		border-radius: 100vh;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
		border-radius: 100vh;
		transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
</style>
