<script>
	let {
		game,
		heroLoaded = false,
		heroSrc = null,
		genres = [],
		heroMetaItems = [],
		isOwned = false,
		myHours = 0,
		totalAch = 0,
		earnedAch = 0,
		achPct = 0,
		criticScore = null,
		hltbPrimary = null,
		friendsInGame = [],
		mediaCount = 0,
	} = $props()
</script>

<div class="hero">
	{#if heroLoaded && heroSrc}
		<img class="hero-media" src={heroSrc} alt="" aria-hidden="true" />
	{/if}
	<div class="hero-gradient"></div>
	<button class="back-btn hero-back" onclick={() => history.back()} aria-label="Go back">
		<i class="fa-solid fa-arrow-left"></i>
		<span>Back</span>
	</button>

	<div class="hero-content">
		{#if genres.length > 0}
			<div class="hero-chips">
				{#each genres.slice(0, 3) as g}
					<span class="genre-chip">{g}</span>
				{/each}
			</div>
		{/if}

		<h1 class="hero-title">{game.name}</h1>

		{#if heroMetaItems.length > 0}
			<div class="hero-meta">
				{#each heroMetaItems as item, i}
					{#if i > 0}<span class="dot-sep">·</span>{/if}
					<span>{item}</span>
				{/each}
			</div>
		{/if}

		<div class="hero-stats">
			{#if isOwned}
				<div class="hero-stat">
					<span class="hero-stat-value">{myHours > 0 ? `${myHours.toLocaleString()}h` : '0h'}</span>
					<span class="hero-stat-label">Your Time</span>
				</div>
			{/if}
			{#if totalAch > 0}
				<div class="hero-stat">
					<span class="hero-stat-value">{achPct}%</span>
					<span class="hero-stat-label">{earnedAch}/{totalAch} Achievements</span>
				</div>
			{/if}
			{#if criticScore !== null}
				<div class="hero-stat">
					<span class="hero-stat-value">{criticScore}</span>
					<span class="hero-stat-label">Metacritic</span>
				</div>
			{/if}
			{#if hltbPrimary}
				<div class="hero-stat">
					<span class="hero-stat-value">{hltbPrimary}</span>
					<span class="hero-stat-label">Main Story</span>
				</div>
			{/if}
			{#if friendsInGame.length > 0}
				<div class="hero-stat live">
					<span class="hero-stat-value">{friendsInGame.length}</span>
					<span class="hero-stat-label">Friends Live</span>
				</div>
			{/if}
			{#if mediaCount > 0}
				<div class="hero-stat">
					<span class="hero-stat-value">{mediaCount}</span>
					<span class="hero-stat-label">Media Items</span>
				</div>
			{/if}
		</div>
	</div>
</div>
