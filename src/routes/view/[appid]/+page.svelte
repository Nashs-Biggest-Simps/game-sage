<script>
    import { page } from '$app/state'
    import { db } from '$lib/data'
    import { steamAPI } from '$lib/steam'
    import { getSteamStoreUrl, launchSteamGame } from '$lib/game-links'
    import { getGenreNames, getSteamHeroCandidates } from '$lib/steam-media'
    import { formatHltb, formatNewsDate, stripHtml } from '$lib/view-game'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import SectionHeader from '$lib/components/layout/SectionHeader.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'

    let appid = $derived(page.params.appid)
    let cachedGame = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
    let playtime = $derived($db?.cache?.library?.playtime?.[appid] ?? 0)
    let isOwned = $derived(appid in ($db?.cache?.library?.playtime ?? {}))
    let cachedFriends = $derived($db?.cache?.friends?.data ?? [])

    let fullGame = $state(null)
    let news = $state([])
    let achievements = $state(null)
    let globalPercentages = $state(null)
    let hltb = $state(null)
    let loading = $state(true)
    let heroUrl = $state(null)
    let modalIndex = $state(null)

    let game = $derived(fullGame ?? cachedGame)
    let genres = $derived(getGenreNames(game?.genres))
    let categories = $derived((game?.categories ?? []).map((category) => category.description).slice(0, 8))
    let screenshots = $derived(game?.screenshots?.slice(0, 8) ?? [])
    let movies = $derived((game?.movies ?? []).filter((movie) => movie.mp4).slice(0, 2))
    let price = $derived(game?.price_overview?.final_formatted ?? (game?.is_free ? 'Free' : null))
    let friendsInGame = $derived(cachedFriends.filter((friend) => String(friend.gameid ?? '') === String(appid)))
    let hours = $derived(Math.round(playtime / 60))
    let achievementTotal = $derived(achievements?.achievements?.length ?? 0)
    let achievementEarned = $derived(achievements?.achievements?.filter((achievement) => achievement.achieved).length ?? 0)
    let achievementPercent = $derived(achievementTotal > 0 ? Math.round((achievementEarned / achievementTotal) * 100) : 0)
    let storeUrl = $derived(getSteamStoreUrl(appid))

    function loadHero() {
        const candidates = getSteamHeroCandidates(appid)
        let index = 0

        function attempt() {
            const next = candidates[index]
            if (!next) {
                heroUrl = null
                return
            }

            const image = new Image()
            image.onload = () => { heroUrl = next }
            image.onerror = () => {
                index += 1
                attempt()
            }
            image.src = next
        }

        attempt()
    }

    function closeModal() {
        modalIndex = null
    }

    function moveModal(direction) {
        if (modalIndex === null) return
        const next = modalIndex + direction
        if (next < 0 || next >= screenshots.length) return
        modalIndex = next
    }

    function handleKeydown(event) {
        if (modalIndex === null) return
        if (event.key === 'Escape') closeModal()
        if (event.key === 'ArrowLeft') moveModal(-1)
        if (event.key === 'ArrowRight') moveModal(1)
    }

    async function loadGame() {
        loading = true
        loadHero()

        try {
            const detailPayload = await steamAPI.getGameDetails(appid)
            fullGame = detailPayload?.[appid]?.data ?? null
        } finally {
            loading = false
        }

        steamAPI.getNewsForApp(appid)
            .then((payload) => {
                news = payload?.appnews?.newsitems?.slice(0, 4) ?? []
            })
            .catch(() => {
                news = []
            })

        steamAPI.howLongToBeat(appid)
            .then((payload) => {
                hltb = payload ?? null
            })
            .catch(() => {
                hltb = null
            })

        steamAPI.getPlayerAchievements(appid)
            .then((payload) => {
                achievements = payload?.playerstats ?? null
            })
            .catch(() => {
                achievements = null
            })

        steamAPI.getGlobalAchievementPercentages(appid)
            .then((payload) => {
                globalPercentages = payload ?? null
            })
            .catch(() => {
                globalPercentages = null
            })
    }

    $effect(() => {
        appid
        fullGame = null
        news = []
        achievements = null
        globalPercentages = null
        hltb = null
        modalIndex = null
        loadGame()
    })
</script>

<svelte:window onkeydown={handleKeydown} />

{#if modalIndex !== null && screenshots[modalIndex]}
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={closeModal} onkeydown={(event) => event.key === 'Escape' && closeModal()}>
        <button class="modal-button close" onclick={closeModal} aria-label="Close screenshot viewer"><i class="fa-solid fa-xmark"></i></button>
        {#if modalIndex > 0}
            <button class="modal-button prev" onclick={(event) => { event.stopPropagation(); moveModal(-1) }} aria-label="Previous screenshot">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        {/if}
        <img class="modal-image" src={screenshots[modalIndex].path_full} alt={`Screenshot ${modalIndex + 1}`} />
        {#if modalIndex < screenshots.length - 1}
            <button class="modal-button next" onclick={(event) => { event.stopPropagation(); moveModal(1) }} aria-label="Next screenshot">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        {/if}
    </div>
{/if}

<div class="view-page" style={heroUrl ? `--hero-image: url('${heroUrl}')` : '--hero-image: none'}>
    <div class="page-backdrop"></div>

    <header class="hero-shell">
        <a class="back-link" href="/dashboard">
            <i class="fa-solid fa-arrow-left"></i>
            Back
        </a>

        <div class="hero-copy">
            {#if genres.length > 0}
                <div class="genre-row">
                    {#each genres.slice(0, 4) as genre}
                        <span class="chip">{genre}</span>
                    {/each}
                </div>
            {/if}
            <h1>{game?.name ?? `App ${appid}`}</h1>
            <p>
                {#if game?.developers?.length}
                    {game.developers[0]}
                {/if}
                {#if game?.release_date?.date}
                    {game?.developers?.length ? ' · ' : ''}{game.release_date.date}
                {/if}
            </p>

            <div class="hero-actions">
                {#if isOwned}
                    <button class="btn-primary" onclick={() => launchSteamGame(appid)}>
                        <i class="fa-solid fa-play"></i>
                        Play in Steam
                    </button>
                {/if}
                <a class="btn-secondary" href={storeUrl} target="_blank" rel="noopener noreferrer">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Open Store Page
                </a>
            </div>
        </div>
    </header>

    <div class="content-grid">
        <div class="main-column">
            <SurfacePanel>
                <SectionHeader title="About this game" subtitle="Store description and context pulled together into one view." />
                {#if game?.short_description}
                    <p class="body-copy">{game.short_description}</p>
                {:else if loading}
                    <p class="body-copy">Loading game details…</p>
                {:else}
                    <EmptyState icon="align-left" title="Description unavailable for this title." compact />
                {/if}
            </SurfacePanel>

            {#if movies.length > 0}
                <SurfacePanel>
                    <SectionHeader title="Trailers" subtitle="Keep media close to the rest of the game context." badge="Video" />
                    <div class="video-grid">
                        {#each movies as movie (movie.id)}
                            <div class="video-card">
                                <video controls preload="none" poster={movie.thumbnail} src={movie.mp4['480'] ?? movie.mp4.max}>
                                    <track kind="captions" />
                                </video>
                                <strong>{movie.name}</strong>
                            </div>
                        {/each}
                    </div>
                </SurfacePanel>
            {/if}

            {#if screenshots.length > 0}
                <SurfacePanel>
                    <SectionHeader title="Screenshots" subtitle="Clickable thumbnails with a lightbox viewer." badge={`${screenshots.length} shots`} />
                    <div class="shot-grid">
                        {#each screenshots as shot, index (shot.id)}
                            <button class="shot" onclick={() => modalIndex = index}>
                                <img src={shot.path_thumbnail} alt="" loading="lazy" />
                            </button>
                        {/each}
                    </div>
                </SurfacePanel>
            {/if}

            {#if achievementTotal > 0}
                <SurfacePanel>
                    <SectionHeader title="Achievement progress" subtitle="Your completion status plus Steam-wide context." badge={`${achievementPercent}%`} />
                    <div class="progress-shell">
                        <div class="progress-bar">
                            <span style:width={`${achievementPercent}%`}></span>
                        </div>
                        <div class="progress-meta">
                            <strong>{achievementEarned} / {achievementTotal} unlocked</strong>
                            <span>{achievementPercent}% complete</span>
                        </div>
                    </div>
                    {#if globalPercentages?.achievementpercentages?.achievements?.length > 0}
                        <div class="achievement-list">
                            {#each globalPercentages.achievementpercentages.achievements.slice(0, 6) as item}
                                <div class="achievement-item">
                                    <strong>{item.name}</strong>
                                    <span>{item.percent.toFixed(1)}% of players</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </SurfacePanel>
            {/if}

            {#if news.length > 0}
                <SurfacePanel>
                    <SectionHeader title="Latest news" subtitle="Store and developer updates pulled into the same game page." badge="Steam news" />
                    <div class="news-list">
                        {#each news as item (item.gid)}
                            <a class="news-item" href={item.url} target="_blank" rel="noopener noreferrer">
                                <strong>{item.title}</strong>
                                <span>{item.feedlabel} · {formatNewsDate(item.date)}</span>
                                {#if item.contents}
                                    <p>{stripHtml(item.contents).slice(0, 180)}…</p>
                                {/if}
                            </a>
                        {/each}
                    </div>
                </SurfacePanel>
            {/if}
        </div>

        <aside class="side-column">
            <SurfacePanel>
                <SectionHeader title="Game facts" subtitle="A denser side panel for the details you actually look up." compact />
                <div class="fact-list">
                    <div><span>Ownership</span><strong>{isOwned ? 'Owned in library' : 'Store only'}</strong></div>
                    <div><span>Your playtime</span><strong>{hours > 0 ? `${hours}h` : 'Unplayed'}</strong></div>
                    <div><span>Price</span><strong>{price ?? 'Unavailable'}</strong></div>
                    <div><span>HowLongToBeat</span><strong>{formatHltb(hltb?.gameplayMain) ?? 'Unknown'}</strong></div>
                    <div><span>Friends active</span><strong>{friendsInGame.length}</strong></div>
                </div>
            </SurfacePanel>

            {#if categories.length > 0}
                <SurfacePanel>
                    <SectionHeader title="Categories" subtitle="Store traits surfaced inline." compact />
                    <div class="tag-cloud">
                        {#each categories as category}
                            <span class="chip">{category}</span>
                        {/each}
                    </div>
                </SurfacePanel>
            {/if}

            {#if friendsInGame.length > 0}
                <SurfacePanel>
                    <SectionHeader title="Friends in this game" subtitle="Live presence from your cached friend activity." compact />
                    <div class="friend-list">
                        {#each friendsInGame as friend (friend.steamid)}
                            <div class="friend-row">
                                <img src={friend.avatarfull} alt="" loading="lazy" />
                                <div>
                                    <strong>{friend.personaname}</strong>
                                    <span>{friend.gameextrainfo}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </SurfacePanel>
            {/if}
        </aside>
    </div>
</div>

<style>
    .view-page {
        position: relative;
        display: grid;
        gap: 1.4rem;
        isolation: isolate;
    }

    .page-backdrop {
        position: absolute;
        inset: -2rem -2rem auto;
        height: 34rem;
        z-index: -1;
        background:
            linear-gradient(180deg, hsl(216, 32%, 7%, 0.05), hsl(216, 38%, 7%) 84%),
            var(--hero-image);
        background-size: cover;
        background-position: center top;
        filter: blur(0px);
        mask-image: linear-gradient(180deg, black, transparent 92%);
        opacity: 0.92;
    }

    .page-backdrop::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
            linear-gradient(180deg, hsl(216, 24%, 7%, 0.22), hsl(216, 28%, 7%, 0.9)),
            radial-gradient(circle at top left, hsl(213, 82%, 56%, 0.22), transparent 26%);
        backdrop-filter: blur(18px);
    }

    .hero-shell {
        display: grid;
        gap: 1rem;
        min-height: 20rem;
        align-content: end;
        padding: 1.2rem 0 1.6rem;
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        width: fit-content;
        padding: 0.55rem 0.88rem;
        border-radius: 999px;
        background: hsl(216, 36%, 8%, 0.55);
        border: 1px solid hsl(214, 22%, 28%, 0.6);
        backdrop-filter: blur(10px);
    }

    .hero-copy {
        display: grid;
        gap: 0.9rem;
        max-width: 42rem;
    }

    .genre-row,
    .hero-actions,
    .video-grid,
    .shot-grid,
    .achievement-list,
    .news-list,
    .fact-list,
    .friend-list,
    .tag-cloud {
        display: grid;
    }

    .genre-row,
    .hero-actions,
    .tag-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
    }

    h1 {
        margin: 0;
        font-size: clamp(2.3rem, 5vw, 4.2rem);
        line-height: 1.02;
        letter-spacing: -0.05em;
    }

    .hero-copy p {
        margin: 0;
        color: hsl(214, 22%, 84%);
        line-height: 1.6;
    }

    .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.9fr);
        gap: 1.2rem;
        align-items: start;
    }

    .main-column,
    .side-column,
    .video-grid,
    .shot-grid,
    .achievement-list,
    .news-list,
    .fact-list,
    .friend-list {
        display: grid;
        gap: 1rem;
    }

    .body-copy {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.75;
    }

    .video-grid {
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    }

    .video-card,
    .achievement-item,
    .news-item,
    .fact-list div,
    .friend-row {
        display: grid;
        gap: 0.45rem;
        padding: 0.9rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .video-card video {
        width: 100%;
        border-radius: 0.9rem;
        background: hsl(214, 24%, 10%);
    }

    .shot-grid {
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    }

    .shot {
        overflow: hidden;
        border-radius: 0.95rem;
        border: 1px solid var(--panel-border);
        background: hsl(214, 24%, 12%);
    }

    .shot img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .progress-shell {
        display: grid;
        gap: 0.8rem;
    }

    .progress-bar {
        height: 0.7rem;
        border-radius: 999px;
        background: hsl(214, 22%, 18%);
        overflow: hidden;
    }

    .progress-bar span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, hsl(213, 82%, 56%), hsl(208, 100%, 72%));
        border-radius: 999px;
    }

    .progress-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        color: var(--text-muted);
    }

    .news-item p,
    .fact-list span,
    .friend-row span,
    .achievement-item span {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.78rem;
        line-height: 1.6;
    }

    .friend-row {
        grid-template-columns: auto 1fr;
        align-items: center;
    }

    .friend-row img {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 999px;
        object-fit: cover;
    }

    .modal {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        background: hsl(220, 52%, 4%, 0.9);
        backdrop-filter: blur(12px);
    }

    .modal-image {
        max-width: min(92vw, 72rem);
        max-height: 84vh;
        border-radius: 1rem;
    }

    .modal-button {
        position: absolute;
        width: 2.8rem;
        height: 2.8rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: hsl(216, 36%, 10%, 0.78);
        color: white;
    }

    .modal-button.close { top: 1.4rem; right: 1.4rem; }
    .modal-button.prev { left: 1.4rem; }
    .modal-button.next { right: 1.4rem; }

    @media (max-width: 1080px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
