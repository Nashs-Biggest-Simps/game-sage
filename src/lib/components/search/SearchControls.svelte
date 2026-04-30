<script>
	let {
		query = $bindable(''),
		mode = $bindable('owned'),
		genreFilter = $bindable(''),
		genreOptions = [],
		searched = false,
		storeLoading = false,
		activeCount = 0,
		runSearch,
		resetSearch,
		activateOwnedMode,
		activateStoreMode,
	} = $props()

	function onKeydown(e) {
		if (e.key === 'Enter') runSearch()
	}

</script>

<div class="search-hero">
	<div class="search-bar">
		<i class="fa-solid fa-magnifying-glass search-icon"></i>
		<input
			class="search-input"
			type="text"
			placeholder="Search for a game..."
			bind:value={query}
			onkeydown={onKeydown}
		/>
		{#if query}
			<button class="clear-btn" onclick={resetSearch} aria-label="Clear">
				<i class="fa-solid fa-xmark"></i>
			</button>
		{/if}
		<button class="search-btn" onclick={runSearch}>Search</button>
	</div>
</div>

<div class="filter-bar">
	<div class="mode-tabs">
		<button class="mode-tab {mode === 'owned' ? 'active' : ''}" onclick={activateOwnedMode}>
			<i class="fa-solid fa-gamepad"></i>
			My Library
		</button>
		<button class="mode-tab {mode === 'store' ? 'active' : ''}" onclick={activateStoreMode}>
			<i class="fa-brands fa-steam"></i>
			Steam Store
		</button>
	</div>

	{#if mode === 'owned'}
		<div class="genre-filter">
			<label class="select-wrap">
				<span class="select-label">Genre</span>
				<span class="select-value" aria-hidden="true">{genreFilter || 'All'}</span>
				<select value={genreFilter} onchange={(e) => { genreFilter = e.target.value }}>
					<option value="">All</option>
					{#each genreOptions as g}
						<option value={g}>{g}</option>
					{/each}
				</select>
				<i class="fa-solid fa-chevron-down select-arrow"></i>
			</label>
		</div>
	{/if}

	{#if searched}
		<div class="result-count">
			{#if storeLoading}
				<i class="fa-solid fa-circle-notch fa-spin"></i> Searching...
			{:else}
				{activeCount} result{activeCount !== 1 ? 's' : ''}
			{/if}
		</div>
	{/if}
</div>
