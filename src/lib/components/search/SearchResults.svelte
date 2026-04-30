<script>
	let {
		query = '',
		submittedQuery = '',
		searched = false,
		storeLoading = false,
		isEmpty = false,
		mode = 'owned',
		ownedResults = [],
		storeResults = [],
		ownedAppIds = [],
		hoursLabel,
		ownedThumbnail,
		storeThumbnail,
		formatPrice,
		discount,
		openGame,
		resolveThumbnail,
	} = $props()
</script>

{#if !searched && !query.trim()}
	<div class="start-state">
		<i class="fa-solid fa-magnifying-glass"></i>
		<span>Type a game name and press Enter or Search</span>
	</div>
{:else if storeLoading}
	<div class="start-state">
		<i class="fa-solid fa-circle-notch fa-spin"></i>
		<span>Searching Steam Store...</span>
	</div>
{:else if isEmpty}
	<div class="start-state">
		<i class="fa-solid fa-face-frown"></i>
		<span>No results for "{submittedQuery || query}"</span>
	</div>
{:else if mode === 'owned'}
	<div class="grid">
		{#each ownedResults as g (g.appid)}
			{@const detail = g.detail}
			{@const hours = hoursLabel(g.playtime)}
			<button class="card owned-card" onclick={() => openGame(g.appid)}>
				<div class="card-art">
					{#if ownedThumbnail(detail, g.appid)}
						<img
							src={ownedThumbnail(detail, g.appid)}
							alt={detail.name}
							loading="lazy"
							decoding="async"
							onerror={(e) => {
								e.currentTarget.style.display = 'none'
							}}
						/>
					{:else}
						<div class="art-fallback"></div>
					{/if}
					<div class="art-badge">{hours}</div>
				</div>
				<div class="card-info">
					<div class="card-name">{detail?.name ?? `App ${g.appid}`}</div>
					{#if detail?.genres?.length}
						<div class="card-tags">
							{#each detail.genres.slice(0, 2) as gen}
								<span class="tag">{gen.description}</span>
							{/each}
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="grid">
		{#each storeResults as item (item.id)}
			{@const price = formatPrice(item)}
			{@const disc = discount(item)}
			<button class="card store-card" onclick={() => openGame(item.id)}>
				<div class="card-art">
					<img
						src={storeThumbnail(item)}
						alt={item.name}
						loading="lazy"
						decoding="async"
						onerror={(e) => {
							const el = e.currentTarget
							const fallback = item.tiny_image ?? resolveThumbnail(item.id)
							if (fallback && el.src !== fallback) {
								el.src = fallback
								el.dataset.fallback = '1'
							} else {
								el.style.display = 'none'
							}
						}}
					/>
					<div class="art-badge store-price">
						{#if disc}
							<span class="disc-pct">-{disc}%</span>
						{/if}
						{price}
					</div>
				</div>
				<div class="card-info">
					<div class="card-name">{item.name}</div>
					{#if ownedAppIds.includes(item.id)}
						<span class="owned-pill"><i class="fa-solid fa-check"></i> Owned</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{/if}
