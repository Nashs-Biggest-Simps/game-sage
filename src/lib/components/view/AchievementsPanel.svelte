<script>
	const achievementFilters = [
		['all', 'All'],
		['earned', 'Earned'],
		['locked', 'Locked'],
		['rare', 'Rarest'],
	]

	let {
		loadingAch = false,
		achievements = null,
		globalPcts = null,
	} = $props()

	let achFilter = $state('all')
	let totalAch = $derived(achievements?.achievements?.length ?? 0)
	let earnedAch = $derived(achievements?.achievements?.filter(a => a.achieved)?.length ?? 0)
	let achPct = $derived(totalAch > 0 ? Math.round((earnedAch / totalAch) * 100) : 0)

	function normalizePct(value) {
		const pct = Number(value)
		return Number.isFinite(pct) ? pct : null
	}

	function achievementDate(unix) {
		return new Date(Number(unix) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}

	function formatAchievementName(value) {
		const cleaned = String(value ?? '')
			.replace(/^achievement[_\s-]*/i, '')
			.replace(/_/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()

		if (!cleaned) return 'Achievement'

		return cleaned
			.split(' ')
			.map(word => {
				if (!word) return ''
				if (word === word.toUpperCase() || word === word.toLowerCase()) {
					return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
				}
				return word
			})
			.join(' ')
	}

	let rarestAch = $derived(() => {
		if (!achievements?.achievements?.length) return []
		const pctMap = {}
		;(globalPcts?.achievementpercentages?.achievements ?? []).forEach(a => {
			pctMap[a.name] = normalizePct(a.percent)
		})
		return achievements.achievements
			.filter(a => a.achieved)
			.map(a => ({ ...a, globalPct: pctMap[a.apiname] ?? null }))
			.sort((a, b) => (a.globalPct ?? 100) - (b.globalPct ?? 100))
			.slice(0, 6)
	})

	let achievementRows = $derived(() => {
		if (!achievements?.achievements?.length) return []
		const pctMap = {}
		;(globalPcts?.achievementpercentages?.achievements ?? []).forEach(a => {
			pctMap[a.name] = normalizePct(a.percent)
		})

		const rows = achievements.achievements.map(a => {
			const earned = Number(a.achieved) === 1
			return {
				...a,
				earned,
				displayName: formatAchievementName(a.name || a.apiname || 'Hidden achievement'),
				displayDescription: a.description || (earned ? 'Unlocked achievement' : 'Details hidden until unlocked.'),
				globalPct: pctMap[a.apiname] ?? null,
				iconUrl: earned ? (a.icon || a.icongray) : (a.icongray || a.icon),
				unlockedAt: earned && a.unlocktime ? achievementDate(a.unlocktime) : null,
			}
		})

		if (achFilter === 'earned') {
			return rows.filter(a => a.earned).sort((a, b) => (Number(b.unlocktime) || 0) - (Number(a.unlocktime) || 0))
		}
		if (achFilter === 'locked') {
			return rows.filter(a => !a.earned).sort((a, b) => (a.globalPct ?? 100) - (b.globalPct ?? 100))
		}
		if (achFilter === 'rare') {
			return rows.filter(a => a.earned).sort((a, b) => (a.globalPct ?? 100) - (b.globalPct ?? 100))
		}

		return rows.sort((a, b) => {
			if (a.earned !== b.earned) return a.earned ? -1 : 1
			if (a.earned) return (Number(b.unlocktime) || 0) - (Number(a.unlocktime) || 0)
			return (a.globalPct ?? 100) - (b.globalPct ?? 100)
		})
	})

	let visibleAchievements = $derived(achievementRows().slice(0, 12))
	let hiddenAchievementCount = $derived(Math.max(achievementRows().length - visibleAchievements.length, 0))
</script>

{#if !loadingAch && achievements?.success && totalAch > 0}
	<section class="panel">
		<div class="ach-top">
			<div class="panel-label"><i class="fa-solid fa-medal"></i>Achievements</div>
			<div class="ach-fraction">
				<span class="ach-earned">{earnedAch}</span>
				<span class="ach-total">/ {totalAch}</span>
			</div>
		</div>
		<div class="ach-bar-track">
			<div class="ach-bar-fill" style="width:{achPct}%"></div>
		</div>
		<div class="ach-summary">
			<span>{achPct}% complete</span>
			<span>{Math.max(totalAch - earnedAch, 0)} locked</span>
			{#if rarestAch().length > 0 && rarestAch()[0].globalPct !== null}
				<span>Rarest earned: {rarestAch()[0].globalPct.toFixed(1)}%</span>
			{/if}
		</div>

		<div class="ach-filter-row" aria-label="Achievement filters">
			{#each achievementFilters as [key, label]}
				<button type="button" class:active={achFilter === key} onclick={() => achFilter = key}>
					{label}
				</button>
			{/each}
		</div>

		{#if visibleAchievements.length > 0}
			<div class="ach-list">
				{#each visibleAchievements as a (a.apiname)}
					<article class:locked={!a.earned} class="ach-item" title="{a.displayName}: {a.displayDescription}">
						{#if a.iconUrl}
							<img src={a.iconUrl} alt="" class="ach-icon" loading="lazy" />
						{:else}
							<div class="ach-icon-ph"><i class="fa-solid fa-trophy"></i></div>
						{/if}
						<div class="ach-info">
							<div class="ach-name-row">
								<div class="ach-name">{a.displayName}</div>
								{#if a.earned}
									<span class="ach-state earned"><i class="fa-solid fa-check"></i>Earned</span>
								{:else}
									<span class="ach-state"><i class="fa-solid fa-lock"></i>Locked</span>
								{/if}
							</div>
							<div class="ach-desc">{a.displayDescription}</div>
							<div class="ach-meta">
								{#if a.globalPct !== null}<span>{a.globalPct.toFixed(1)}% of players</span>{/if}
								{#if a.unlockedAt}<span>Unlocked {a.unlockedAt}</span>{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
			{#if hiddenAchievementCount > 0}
				<div class="ach-more">
					Showing 12 of {achievementRows().length} {achFilter === 'all' ? 'achievements' : achFilter}
				</div>
			{/if}
		{:else}
			<div class="ach-empty">
				{achFilter === 'locked' ? 'No locked achievements left.' : 'No achievements match this filter yet.'}
			</div>
		{/if}
	</section>
{/if}
