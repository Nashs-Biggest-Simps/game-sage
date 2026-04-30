<script>
	import AchievementsPanel from './AchievementsPanel.svelte'

	let {
		game,
		movies = [],
		screenshots = [],
		screenshotLeftFade = 0,
		loadingAch = false,
		achievements = null,
		globalPcts = null,
		news = [],
		openModal,
		handleScreenshotScroll,
		newsDate,
		stripHtml,
	} = $props()
</script>

<div class="main-col">
	{#if game.short_description}
		<section class="panel">
			<div class="panel-label"><i class="fa-solid fa-align-left"></i>About This Game</div>
			<p class="description">{game.short_description}</p>
		</section>
	{/if}

	{#if movies.length > 0}
		<section class="panel">
			<div class="panel-label"><i class="fa-solid fa-film"></i>Trailers</div>
			<div class="videos-list">
				{#each movies as m (m.id)}
					<div class="video-wrap">
						<video
							class="trailer-video"
							controls
							preload="none"
							poster={m.thumbnail}
							src={m.mp4['480'] ?? m.mp4.max}
						>
							<track kind="captions" />
						</video>
						<div class="video-label">{m.name}</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if screenshots.length > 0}
		<section class="panel">
			<div class="panel-label"><i class="fa-solid fa-images"></i>Screenshots</div>
			<div
				class="screenshots-scroll horizontal-scroll"
				style="--left-fade-width: {screenshotLeftFade * 4}rem"
				onscroll={(e) => handleScreenshotScroll(e)}
			>
				{#each screenshots as s, i (s.id)}
					<button class="ss-btn" onclick={() => openModal(i)} aria-label="View screenshot {i + 1}">
						<img src={s.path_thumbnail} alt="" loading="lazy" class="ss-img" />
						<div class="ss-hover-overlay">
							<i class="fa-solid fa-magnifying-glass-plus"></i>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<AchievementsPanel {loadingAch} {achievements} {globalPcts} />

	{#if news.length > 0}
		<section class="panel">
			<div class="panel-label"><i class="fa-solid fa-newspaper"></i>Latest News</div>
			<div class="news-list">
				{#each news as item (item.gid)}
					<a href={item.url} target="_blank" rel="noopener noreferrer" class="news-item">
						<div class="news-top">
							<span class="news-source">{item.feedlabel}</span>
							<span class="news-date">{newsDate(item.date)}</span>
						</div>
						<div class="news-title">{item.title}</div>
						{#if item.contents}
							<div class="news-snippet">{stripHtml(item.contents)}...</div>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
