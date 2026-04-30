<script>
	let {
		appid,
		game,
		isOwned = false,
		storeUrl,
		websiteHref = null,
		price = null,
		discount = 0,
		origPrice = null,
		myHours = 0,
		friendsInGame = [],
		hltb = null,
		hltbFmt,
		criticScore = null,
		criticUrl = null,
		supportRows = [],
		categories = [],
		gameDetailRows = [],
		genres = [],
	} = $props()
</script>

<aside class="info-col">
	<div class="panel action-panel">
		{#if isOwned}
			<button class="btn-primary btn-play-game" onclick={() => { window.location.href = `steam://run/${appid}` }}>
				<i class="fa-solid fa-play"></i>
				Play in Steam
			</button>
			<a href={storeUrl} target="_blank" rel="noopener noreferrer" class="btn-secondary">
				<i class="fa-brands fa-steam"></i>
				View on Store
			</a>
			{#if websiteHref}
				<a href={websiteHref} target="_blank" rel="noopener noreferrer" class="btn-secondary">
					<i class="fa-solid fa-globe"></i>
					Official Website
				</a>
			{/if}
		{:else}
			<a href={storeUrl} target="_blank" rel="noopener noreferrer" class="btn-primary btn-buy">
				<i class="fa-solid fa-cart-shopping"></i>
				{#if discount > 0}<span class="discount-badge">-{discount}%</span>{/if}
				{price ? `Buy · ${price}` : game?.is_free ? 'Get for Free' : 'View on Steam'}
			</a>
			{#if !game?.is_free}
				<a href="https://store.steampowered.com/wishlist/add/{appid}" target="_blank" rel="noopener noreferrer" class="btn-secondary">
					<i class="fa-solid fa-bookmark"></i>
					Add to Wishlist
				</a>
			{/if}
			{#if websiteHref}
				<a href={websiteHref} target="_blank" rel="noopener noreferrer" class="btn-secondary">
					<i class="fa-solid fa-globe"></i>
					Official Website
				</a>
			{/if}
			{#if discount > 0 && origPrice}
				<div class="orig-price">Was {origPrice}</div>
			{/if}
		{/if}
	</div>

	{#if isOwned}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-clock"></i>Your Playtime</div>
			<div class="playtime-big">{myHours > 0 ? `${myHours.toLocaleString()}h` : 'Never played'}</div>
			{#if myHours > 0}<div class="playtime-sub">hours in your library</div>{/if}
		</div>
	{/if}

	{#if friendsInGame.length > 0}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-user-group"></i>Friends Playing Now</div>
			<div class="friends-list">
				{#each friendsInGame as f (f.steamid)}
					<div class="friend-row">
						<div class="friend-av-wrap">
							<img class="friend-av" src={f.avatarmedium} alt="" loading="lazy" />
							<div class="friend-dot"></div>
						</div>
						<div class="friend-name">{f.personaname}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if hltb?.mainStory || hltb?.mainStoryWithExtras || hltb?.completionist}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-hourglass-half"></i>How Long to Beat</div>
			<div class="hltb-list">
				{#if hltb.mainStory}<div class="hltb-row"><span class="hltb-key">Main Story</span><span class="hltb-val">{hltbFmt(hltb.mainStory)}</span></div>{/if}
				{#if hltb.mainStoryWithExtras}<div class="hltb-row"><span class="hltb-key">Main + Extras</span><span class="hltb-val">{hltbFmt(hltb.mainStoryWithExtras)}</span></div>{/if}
				{#if hltb.completionist}<div class="hltb-row"><span class="hltb-key">Completionist</span><span class="hltb-val">{hltbFmt(hltb.completionist)}</span></div>{/if}
			</div>
		</div>
	{/if}

	{#if criticScore !== null}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-star-half-stroke"></i>Metacritic</div>
			<div class="meta-score-row">
				<div class="meta-score {criticScore >= 75 ? 'great' : criticScore >= 50 ? 'mixed' : 'poor'}">{criticScore}</div>
				{#if criticUrl}
					<a href={criticUrl} target="_blank" rel="noopener noreferrer" class="meta-link">Read reviews -></a>
				{:else}
					<div class="meta-link muted">Critic score</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if supportRows.length > 0 || categories.length > 0}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-layer-group"></i>Store Features</div>
			{#if supportRows.length > 0}
				<div class="detail-rows">
					{#each supportRows as row (row.label)}
						<div class="detail-row"><span class="detail-key">{row.label}</span><span class="detail-val">{row.value}</span></div>
					{/each}
				</div>
			{/if}
			{#if categories.length > 0}
				<div class="chip-row">
					{#each categories as c}<span class="chip dim">{c}</span>{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if gameDetailRows.length > 0 || genres.length > 0}
		<div class="panel">
			<div class="panel-label"><i class="fa-solid fa-circle-info"></i>Game Details</div>
			{#if gameDetailRows.length > 0}
				<div class="detail-rows">
					{#each gameDetailRows as row (row.label)}
						<div class="detail-row"><span class="detail-key">{row.label}</span><span class="detail-val">{row.value}</span></div>
					{/each}
				</div>
			{/if}
			{#if genres.length > 0}
				<div class="chip-row">
					{#each genres as g}<span class="chip">{g}</span>{/each}
				</div>
			{/if}
		</div>
	{/if}
</aside>
