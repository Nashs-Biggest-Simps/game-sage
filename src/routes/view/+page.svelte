<script>
	    import { page }    from '$app/state'
	    import { get } from 'svelte/store'
	    import { db }      from '$lib/data'
	    import { steamAPI } from '$lib/steam'
	    import { fetchGameDetail, resolveThumbnail } from '$lib/cache'

    let appid = $derived(page.url.searchParams.get('id'))

    let cachedGame  = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)
    let fetchedGame = $state(null)
    let game        = $derived(fetchedGame ?? cachedGame)
    let loadingGame = $state(true)

    let hltb         = $state(null)
    let news         = $state([])
    let achievements = $state(null)
    let globalPcts   = $state(null)
    let loadingAch   = $state(true)
	    let friends      = $derived($db?.cache?.friends?.data ?? [])

	    const VIEW_TTL = {
	        hltb:         7 * 24 * 60 * 60 * 1000,
	        news:         6 * 60 * 60 * 1000,
	        achievements: 15 * 60 * 1000,
	        globalPcts:   7 * 24 * 60 * 60 * 1000,
	    }

	    function isFresh(entry, ttl) {
	        return !!entry?.fetchedAt && (Date.now() - entry.fetchedAt) < ttl
	    }

	    function readViewCache(id, key, ttl) {
	        const entry = get(db)?.cache?.view?.[id]?.[key] ?? null
	        return isFresh(entry, ttl) ? entry.data : null
	    }

	    function writeViewCache(id, key, data) {
	        db.update(state => {
	            state.cache ??= {}
	            state.cache.view ??= {}
	            state.cache.view[id] ??= {}
	            state.cache.view[id][key] = { data, fetchedAt: Date.now() }
	            return state
	        })
	    }

    let myPlaytime = $derived($db?.cache?.library?.playtime?.[appid] ?? 0)
    let myHours    = $derived(Math.round(myPlaytime / 60))
    let isOwned    = $derived(appid in ($db?.cache?.library?.playtime ?? {}))

	    let screenshots    = $derived(game?.screenshots?.slice(0, 12) ?? [])
	    let movies         = $derived(game?.movies?.filter(m => m.mp4)?.slice(0, 3) ?? [])
	    let price          = $derived(game?.price_overview?.final_formatted ?? (game?.is_free ? 'Free' : null))
	    let discount       = $derived(game?.price_overview?.discount_percent ?? 0)
	    let origPrice      = $derived(game?.price_overview?.initial_formatted ?? null)
	    let storeUrl       = $derived(`https://store.steampowered.com/app/${appid}`)
	    let genres         = $derived(game?.genres?.map(g => g.description) ?? [])
	    let categories     = $derived(game?.categories?.slice(0, 6)?.map(c => c.description) ?? [])
	    let platformNames  = $derived(
	        Object.entries(game?.platforms ?? {})
	            .filter(([, supported]) => supported)
	            .map(([platform]) => titleCase(platform))
	    )
	    let supportedLanguages = $derived(game?.supported_languages ?? [])
	    let friendsInGame  = $derived(friends.filter(f => f.gameid && String(f.gameid) === String(appid)))
	    let criticScore    = $derived(game?.metacritic?.score ?? game?.metacritic_score ?? null)
	    let criticUrl      = $derived(game?.metacritic?.url ?? null)
	    let reviewTotal    = $derived(game?.recommendations?.total ?? null)
	    let mediaCount     = $derived(screenshots.length + movies.length)
	    let websiteHref    = $derived(normalizeWebsiteUrl(game?.website))
	    let releaseLabel   = $derived(() => {
	        const date = game?.release_date?.date?.trim?.() ?? ''
	        if (!date) return null
	        return game?.release_date?.coming_soon ? `Coming ${date}` : date
	    })
	    let controllerSupportLabel = $derived(() => {
	        const support = String(game?.controller_support ?? '').trim().toLowerCase()
	        if (!support) return null
	        if (support === 'full') return 'Full controller support'
	        if (support === 'partial') return 'Partial controller support'
	        return titleCase(support)
	    })
	    let ageRating = $derived(() => {
	        const age = Number(game?.required_age ?? 0)
	        return Number.isFinite(age) && age > 0 ? `${age}+` : null
	    })
	    let heroMetaItems = $derived(() => {
	        const items = []
	        if (game?.developers?.[0]) items.push(game.developers[0])
	        if (game?.publishers?.[0] && game.publishers[0] !== game?.developers?.[0]) items.push(game.publishers[0])
	        if (releaseLabel()) items.push(releaseLabel())
	        return items
	    })
	    let snapshotItems = $derived(() => {
	        const items = [
	            {
	                label: 'Library',
	                value: isOwned ? 'Owned' : 'Not owned',
	                note: isOwned
	                    ? (myHours > 0 ? `${myHours.toLocaleString()}h logged` : 'In your Steam library')
	                    : (game?.is_free ? 'Free to claim on Steam' : 'Available on Steam'),
	            },
	        ]

	        if (price || game?.is_free) {
	            items.push({
	                label: 'Price',
	                value: price ?? 'Free',
	                note: discount > 0 && origPrice
	                    ? `Was ${origPrice}`
	                    : (game?.is_free ? 'Free to play' : 'Current store price'),
	            })
	        }
	        if (reviewTotal) items.push({
	            label: 'Reviews',
	            value: reviewTotal.toLocaleString(),
	            note: 'Steam user reviews',
	        })
	        if (criticScore !== null) items.push({
	            label: 'Critics',
	            value: String(criticScore),
	            note: 'Metacritic score',
	        })
	        if (platformNames.length) items.push({
	            label: 'Platforms',
	            value: platformNames.join(' / '),
	            note: platformNames.length > 1 ? 'Supported platforms' : 'Supported platform',
	        })
	        if (supportedLanguages.length) items.push({
	            label: 'Languages',
	            value: String(supportedLanguages.length),
	            note: supportedLanguages.slice(0, 3).join(', '),
	        })
	        if (mediaCount > 0) items.push({
	            label: 'Media',
	            value: String(mediaCount),
	            note: `${screenshots.length} screenshots${movies.length ? `, ${movies.length} trailers` : ''}`,
	        })
	        if (game?.dlc_count > 0) items.push({
	            label: 'DLC',
	            value: String(game.dlc_count),
	            note: 'Additional downloadable items',
	        })

	        return items.slice(0, 6)
	    })
	    let gameDetailRows = $derived(() => {
	        const rows = []
	        if (game?.type) rows.push({ label: 'Type', value: titleCase(game.type) })
	        if (releaseLabel()) rows.push({
	            label: game?.release_date?.coming_soon ? 'Launch' : 'Released',
	            value: releaseLabel(),
	        })
	        if (game?.developers?.length) rows.push({ label: 'Developer', value: game.developers.join(', ') })
	        if (game?.publishers?.length) rows.push({ label: 'Publisher', value: game.publishers.join(', ') })
	        if (platformNames.length) rows.push({ label: 'Platforms', value: platformNames.join(', ') })
	        if (totalAch > 0) rows.push({ label: 'Achievements', value: `${totalAch} total` })
	        if (reviewTotal) rows.push({ label: 'Reviews', value: `${reviewTotal.toLocaleString()} reviews` })
	        if (game?.dlc_count > 0) rows.push({ label: 'DLC', value: `${game.dlc_count} items` })
	        if (screenshots.length > 0) rows.push({ label: 'Screenshots', value: `${screenshots.length} available` })
	        if (movies.length > 0) rows.push({ label: 'Trailers', value: `${movies.length} available` })
	        return rows
	    })
	    let supportRows = $derived(() => {
	        const rows = []
	        if (controllerSupportLabel()) rows.push({ label: 'Controller', value: controllerSupportLabel() })
	        if (ageRating()) rows.push({ label: 'Age Gate', value: ageRating() })
	        if (supportedLanguages.length) rows.push({
	            label: 'Languages',
	            value: supportedLanguages.slice(0, 5).join(', ') + (supportedLanguages.length > 5 ? ` +${supportedLanguages.length - 5} more` : ''),
	        })
	        return rows
	    })

	    function fallbackHeroImages(id) {
	        return [
	            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/library_hero.jpg`,
	            `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
	        ]
	    }

	    // Hero image with JS preload fallback chain
	    let heroIdx    = $state(0)
	    let heroCandidates = $derived(
	        [...new Set([
	            ...fallbackHeroImages(appid ?? '0'),
	            game?.hero_image,
	            cachedGame?.hero_image,
	            game?.thumbnail,
	            cachedGame?.thumbnail,
	            appid ? resolveThumbnail(appid) : null,
	        ].filter(Boolean))]
	    )
	    let heroSrc    = $derived(heroCandidates[heroIdx] ?? null)
	    let heroFailed = $derived(heroIdx >= heroCandidates.length)
	    $effect(() => {
	        appid
	        game?.thumbnail
	        cachedGame?.thumbnail
	        heroIdx = 0
	    })

    let heroLoaded = $state(false)
    $effect(() => {
        if (!heroSrc || heroFailed) { heroLoaded = false; return }
        heroLoaded = false
        const img = new Image()
        img.onload  = () => { heroLoaded = true }
        img.onerror = () => { heroIdx++; heroLoaded = false }
        img.src = heroSrc
    })

    // Screenshot modal
    let modalIdx = $state(null)
	    let modalSrc = $derived(modalIdx !== null ? (screenshots[modalIdx]?.path_full ?? null) : null)
	    let screenshotLeftFade = $state(0)
	    function openModal(idx) { modalIdx = idx }
	    function closeModal()   { modalIdx = null }
	    function modalPrev()    { if (modalIdx > 0) modalIdx-- }
	    function modalNext()    { if (modalIdx < screenshots.length - 1) modalIdx++ }

	    function handleScreenshotScroll(e) {
	        const pivotPoint = 100
	        screenshotLeftFade = Math.min(e.target.scrollLeft / pivotPoint, 1)
	    }

    function handleKeydown(e) {
        if (modalIdx === null) return
        if (e.key === 'Escape')     closeModal()
        if (e.key === 'ArrowLeft')  modalPrev()
        if (e.key === 'ArrowRight') modalNext()
    }

    // Achievements
    let totalAch  = $derived(achievements?.achievements?.length ?? 0)
    let earnedAch = $derived(achievements?.achievements?.filter(a => a.achieved)?.length ?? 0)
	    let achPct    = $derived(totalAch > 0 ? Math.round((earnedAch / totalAch) * 100) : 0)

	    function normalizePct(value) {
	        const pct = Number(value)
	        return Number.isFinite(pct) ? pct : null
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

	    let activeViewLoad = 0
	    let lastLoadedAppid = null

	    $effect(() => {
	        const id = appid
	        if (!id) {
	            lastLoadedAppid = null
	            activeViewLoad++
	            fetchedGame = null
	            loadingGame = false
	            hltb = null
	            news = []
	            achievements = null
	            globalPcts = null
	            loadingAch = false
	            return
	        }

	        if (id === lastLoadedAppid) return
	        lastLoadedAppid = id

	        const viewLoadId = ++activeViewLoad
	        const state = get(db)
	        const currentCachedGame = state?.cache?.library?.details?.[id]?.data ?? null
	        const owned = Object.prototype.hasOwnProperty.call(state?.cache?.library?.playtime ?? {}, id)
	        const needsRichDetail = (
	            !Array.isArray(currentCachedGame?.screenshots) ||
	            !Array.isArray(currentCachedGame?.movies) ||
	            currentCachedGame?.platforms == null ||
	            currentCachedGame?.supported_languages === undefined ||
	            currentCachedGame?.website === undefined ||
	            currentCachedGame?.required_age === undefined ||
	            currentCachedGame?.controller_support === undefined ||
	            currentCachedGame?.dlc_count === undefined ||
	            currentCachedGame?.hero_image === undefined
	        )

	        fetchedGame = null
	        loadingGame = true
	        hltb = null
	        news = []
	        achievements = null
	        globalPcts = null
	        loadingAch = owned

	        if (!currentCachedGame || needsRichDetail) {
	            fetchGameDetail(id).then(game => {
	                if (viewLoadId !== activeViewLoad) return
	                fetchedGame = game
	                loadingGame = false
	            })
	        } else {
	            loadingGame = false
	        }

	        const cachedHltb = readViewCache(id, 'hltb', VIEW_TTL.hltb)
	        if (cachedHltb !== null) {
	            hltb = cachedHltb
	        } else {
	            steamAPI.howLongToBeat(id, ret => {
	                if (viewLoadId !== activeViewLoad) return
	                hltb = ret ?? null
	                writeViewCache(id, 'hltb', hltb)
	            })
	        }

	        const cachedNews = readViewCache(id, 'news', VIEW_TTL.news)
	        if (cachedNews !== null) {
	            news = cachedNews
	        } else {
	            steamAPI.getNewsForApp(id, ret => {
	                if (viewLoadId !== activeViewLoad) return
	                news = ret?.appnews?.newsitems?.slice(0, 4) ?? []
	                writeViewCache(id, 'news', news)
	            })
	        }

	        if (!owned) {
	            loadingAch = false
	            return
	        }

	        const cachedAchievements = readViewCache(id, 'achievements', VIEW_TTL.achievements)
	        if (cachedAchievements !== null) {
	            achievements = cachedAchievements
	            loadingAch = false
	        } else {
	            steamAPI.getPlayerAchievements(id, ret => {
	                if (viewLoadId !== activeViewLoad) return
	                achievements = ret?.playerstats ?? null
	                loadingAch = false
	                writeViewCache(id, 'achievements', achievements)
	            })
	        }

	        const cachedGlobalPcts = readViewCache(id, 'globalPcts', VIEW_TTL.globalPcts)
	        if (cachedGlobalPcts !== null) {
	            globalPcts = cachedGlobalPcts
	        } else {
	            steamAPI.getGlobalAchievementPercentages(id, ret => {
	                if (viewLoadId !== activeViewLoad) return
	                globalPcts = ret ?? null
	                writeViewCache(id, 'globalPcts', globalPcts)
	            })
	        }
	    })

    function hltbFmt(val) {
        if (!val) return null
        const h = Math.trunc(val)
        const m = Math.round((val % 1) * 60)
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }

    let hltbPrimary = $derived(hltbFmt(hltb?.mainStory ?? hltb?.mainStoryWithExtras ?? hltb?.completionist))

    function newsDate(unix) {
        return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

	    function stripHtml(html) {
	        return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)
	    }

	    function titleCase(value = '') {
	        return String(value)
	            .split(/[\s_-]+/)
	            .filter(Boolean)
	            .map(word => word[0].toUpperCase() + word.slice(1))
	            .join(' ')
	    }

	    function normalizeWebsiteUrl(value) {
	        const url = String(value ?? '').trim()
	        if (!url) return null
	        return /^https?:\/\//i.test(url) ? url : `https://${url}`
	    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Screenshot modal -->
{#if modalIdx !== null && modalSrc}
    <div
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Screenshot viewer"
        tabindex="-1"
        onclick={closeModal}
        onkeydown={(e) => e.key === 'Escape' && closeModal()}
    >
        <button class="modal-close" onclick={closeModal} aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
        </button>

        {#if modalIdx > 0}
            <button class="modal-nav prev" onclick={(e) => { e.stopPropagation(); modalPrev() }} aria-label="Previous screenshot">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        {/if}

        <img
            class="modal-img"
            src={modalSrc}
            alt="Screenshot {modalIdx + 1}"
        />

        {#if modalIdx < screenshots.length - 1}
            <button class="modal-nav next" onclick={(e) => { e.stopPropagation(); modalNext() }} aria-label="Next screenshot">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        {/if}

        <div class="modal-counter">{modalIdx + 1} / {screenshots.length}</div>
    </div>
{/if}

<div class="view-page">

    {#if loadingGame && !game}
        <div class="sk-hero">
            <button class="back-btn hero-back" onclick={() => history.back()} aria-label="Go back">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Back</span>
            </button>
        </div>
        <div class="content-grid">
            <div class="main-col sk-col">
                <div class="sk-panel"></div>
                <div class="sk-panel"></div>
            </div>
            <div class="info-col sk-col">
                <div class="sk-panel sm"></div>
                <div class="sk-panel sm"></div>
                <div class="sk-panel sm"></div>
            </div>
        </div>

    {:else if game}

        <!-- Hero -->
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
	                {#if heroMetaItems().length > 0}
	                    <div class="hero-meta">
	                        {#each heroMetaItems() as item, i}
	                            {#if i > 0}
	                                <span class="dot-sep">·</span>
	                            {/if}
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

        <!-- Two-column content -->
        <div class="content-grid">

            <!-- ── Main column ── -->
            <div class="main-col">

	                <!-- About -->
	                {#if game.short_description}
	                    <section class="panel">
	                        <div class="panel-label"><i class="fa-solid fa-align-left"></i>About This Game</div>
	                        <p class="description">{game.short_description}</p>
	                    </section>
	                {/if}

	                {#if snapshotItems().length > 0}
	                    <section class="panel">
	                        <div class="panel-label"><i class="fa-solid fa-table-cells-large"></i>At a Glance</div>
	                        <div class="snapshot-grid">
	                            {#each snapshotItems() as item (item.label)}
	                                <div class="snapshot-card">
	                                    <div class="snapshot-label">{item.label}</div>
	                                    <div class="snapshot-value">{item.value}</div>
	                                    {#if item.note}
	                                        <div class="snapshot-note">{item.note}</div>
	                                    {/if}
	                                </div>
	                            {/each}
	                        </div>
	                    </section>
	                {/if}

                <!-- Trailers -->
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

                <!-- Screenshots -->
                {#if screenshots.length > 0}
                    <section class="panel">
                        <div class="panel-label"><i class="fa-solid fa-images"></i>Screenshots</div>
	                        <div
	                            class="screenshots-scroll horizontal-scroll"
	                            style="--left-fade-width: {screenshotLeftFade * 4}rem"
	                            onscroll={(e) => handleScreenshotScroll(e)}
	                        >
                            {#each screenshots as s, i (s.id)}
                                <button
                                    class="ss-btn"
                                    onclick={() => openModal(i)}
                                    aria-label="View screenshot {i + 1}"
                                >
                                    <img src={s.path_thumbnail} alt="" loading="lazy" class="ss-img" />
                                    <div class="ss-hover-overlay">
                                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </section>
                {/if}

                <!-- Achievements -->
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
                        <div class="ach-pct">{achPct}% complete</div>

                        {#if rarestAch().length > 0}
                            <div class="ach-sublabel">
                                <i class="fa-solid fa-star"></i>Rarest Earned
                            </div>
                            <div class="ach-grid">
                                {#each rarestAch() as a (a.apiname)}
                                    <div class="ach-item" title="{a.name}: {a.description ?? ''}">
                                        {#if a.icon}
                                            <img src={a.icon} alt={a.name} class="ach-icon" loading="lazy" />
                                        {:else}
                                            <div class="ach-icon-ph"><i class="fa-solid fa-trophy"></i></div>
                                        {/if}
                                        <div class="ach-info">
                                            <div class="ach-name">{a.name}</div>
                                            {#if a.globalPct !== null}
                                                <div class="ach-rarity">{a.globalPct.toFixed(1)}% of players</div>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </section>
                {/if}

                <!-- News -->
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
                                        <div class="news-snippet">{stripHtml(item.contents)}…</div>
                                    {/if}
                                </a>
                            {/each}
                        </div>
                    </section>
                {/if}

            </div>

            <!-- ── Info sidebar ── -->
            <aside class="info-col">

                <!-- Action buttons: context-aware -->
                <div class="panel action-panel">
                    {#if isOwned}
                        <button
                            class="btn-primary btn-play-game"
                            onclick={() => { window.location.href = `steam://run/${appid}` }}
                        >
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
                            {#if discount > 0}
                                <span class="discount-badge">-{discount}%</span>
                            {/if}
                            {price ? `Buy · ${price}` : game?.is_free ? 'Get for Free' : 'View on Steam'}
                        </a>
                        {#if !game?.is_free}
                            <a
                                href="https://store.steampowered.com/wishlist/add/{appid}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn-secondary"
                            >
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

                <!-- Personal playtime (only when owned) -->
                {#if isOwned}
                    <div class="panel">
                        <div class="panel-label"><i class="fa-solid fa-clock"></i>Your Playtime</div>
                        <div class="playtime-big">
                            {myHours > 0 ? `${myHours.toLocaleString()}h` : 'Never played'}
                        </div>
                        {#if myHours > 0}
                            <div class="playtime-sub">hours in your library</div>
                        {/if}
                    </div>
                {/if}

                <!-- Friends playing this game right now -->
                {#if friendsInGame.length > 0}
                    <div class="panel">
                        <div class="panel-label">
                            <i class="fa-solid fa-user-group"></i>
                            Friends Playing Now
                        </div>
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

                <!-- HLTB -->
                {#if hltb?.mainStory || hltb?.mainStoryWithExtras || hltb?.completionist}
                    <div class="panel">
                        <div class="panel-label"><i class="fa-solid fa-hourglass-half"></i>How Long to Beat</div>
                        <div class="hltb-list">
                            {#if hltb.mainStory}
                                <div class="hltb-row">
                                    <span class="hltb-key">Main Story</span>
                                    <span class="hltb-val">{hltbFmt(hltb.mainStory)}</span>
                                </div>
                            {/if}
                            {#if hltb.mainStoryWithExtras}
                                <div class="hltb-row">
                                    <span class="hltb-key">Main + Extras</span>
                                    <span class="hltb-val">{hltbFmt(hltb.mainStoryWithExtras)}</span>
                                </div>
                            {/if}
                            {#if hltb.completionist}
                                <div class="hltb-row">
                                    <span class="hltb-key">Completionist</span>
                                    <span class="hltb-val">{hltbFmt(hltb.completionist)}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Metacritic score (if available) -->
	                {#if criticScore !== null}
	                    <div class="panel">
	                        <div class="panel-label"><i class="fa-solid fa-star-half-stroke"></i>Metacritic</div>
	                        <div class="meta-score-row">
                            <div class="meta-score {criticScore >= 75 ? 'great' : criticScore >= 50 ? 'mixed' : 'poor'}">
                                {criticScore}
                            </div>
                            {#if criticUrl}
                                <a
                                    href={criticUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="meta-link"
                                >
                                    Read reviews →
                                </a>
                            {:else}
                                <div class="meta-link muted">Critic score</div>
                            {/if}
                        </div>
	                    </div>
	                {/if}

	                {#if supportRows().length > 0 || categories.length > 0}
	                    <div class="panel">
	                        <div class="panel-label"><i class="fa-solid fa-layer-group"></i>Store Features</div>
	                        {#if supportRows().length > 0}
	                            <div class="detail-rows">
	                                {#each supportRows() as row (row.label)}
	                                    <div class="detail-row">
	                                        <span class="detail-key">{row.label}</span>
	                                        <span class="detail-val">{row.value}</span>
	                                    </div>
	                                {/each}
	                            </div>
	                        {/if}
	                        {#if categories.length > 0}
	                            <div class="chip-row">
	                                {#each categories as c}
	                                    <span class="chip dim">{c}</span>
	                                {/each}
	                            </div>
	                        {/if}
	                    </div>
	                {/if}

	                {#if gameDetailRows().length > 0 || genres.length > 0}
	                    <div class="panel">
	                        <div class="panel-label"><i class="fa-solid fa-circle-info"></i>Game Details</div>
	                        {#if gameDetailRows().length > 0}
	                            <div class="detail-rows">
	                                {#each gameDetailRows() as row (row.label)}
	                                    <div class="detail-row">
	                                        <span class="detail-key">{row.label}</span>
	                                        <span class="detail-val">{row.value}</span>
	                                    </div>
	                                {/each}
	                            </div>
	                        {/if}
	                        {#if genres.length > 0}
	                            <div class="chip-row">
	                                {#each genres as g}
	                                    <span class="chip">{g}</span>
	                                {/each}
	                            </div>
	                        {/if}
	                    </div>
	                {/if}

	            </aside>
	        </div>

    {:else}
        <div class="not-found">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Could not load game data</span>
        </div>
    {/if}

</div>

<style>
	    .view-page {
	        position: relative;
	        display: flex;
	        flex-direction: column;
	        gap: 1.4rem;
	        isolation: isolate;
	        margin-top: -0.8rem;
	        padding-bottom: 2rem;
	    }

    .view-page::before {
        content: '';
	        position: absolute;
	        z-index: 0;
	        top: -2.4rem;
	        bottom: -8rem;
	        left: 50%;
	        width: 100vw;
	        min-height: calc(100% + 10rem);
	        transform: translateX(-50%);
	        pointer-events: none;
	        background:
	            radial-gradient(circle at 18% 4%, hsl(188, 74%, 42%, 0.16), transparent 18rem),
	            radial-gradient(circle at 82% 12%, hsl(214, 78%, 46%, 0.12), transparent 20rem),
	            radial-gradient(circle at 46% 34rem, hsl(265, 60%, 50%, 0.08), transparent 28rem),
	            radial-gradient(circle at 50% calc(100% - 4rem), hsl(188, 64%, 40%, 0.08), transparent 20rem),
	            linear-gradient(to bottom, hsl(212,22%,8%,0.14) 0%, hsl(212,22%,8%,0.06) 44rem, hsl(212,22%,8%,0.24) 100%);
	        opacity: 0.78;
	        filter: saturate(1.08);
	    }

	    .view-page::after {
	        content: '';
	        position: absolute;
	        z-index: 0;
	        left: 50%;
	        bottom: -9rem;
	        width: 100vw;
	        height: 18rem;
	        transform: translateX(-50%);
	        pointer-events: none;
	        background:
	            radial-gradient(circle at 24% 0%, hsl(188, 74%, 42%, 0.08), transparent 18rem),
	            radial-gradient(circle at 78% 10%, hsl(214, 78%, 46%, 0.07), transparent 18rem),
	            linear-gradient(to bottom, transparent 0%, hsl(212, 24%, 8%, 0.3) 100%);
	        opacity: 0.72;
	    }

    .view-page > * {
        position: relative;
        z-index: 1;
    }

    /* ── Modal ───────────────────────────── */

    :global(.content:has(.modal-backdrop)) {
        z-index: 100;
    }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: hsl(0,0%,0%,0.92);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(6px);
        cursor: pointer;
    }

    .modal-img {
        max-width: min(90vw, 1280px);
        max-height: 85vh;
        border-radius: 0.6rem;
        object-fit: contain;
        cursor: default;
        box-shadow: 0 24px 80px hsl(0,0%,0%,0.8);
    }

    .modal-close {
        position: fixed;
        top: 1.2rem;
        right: 1.4rem;
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 50%;
        background: hsl(0,0%,100%,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        color: white;
        cursor: pointer;
        transition: background 120ms;
        z-index: 10001;
    }

    .modal-close:hover { background: hsl(0,0%,100%,0.22); }

    .modal-nav {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: hsl(0,0%,100%,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        color: white;
        cursor: pointer;
        transition: background 120ms;
        z-index: 10001;
    }

    .modal-nav:hover { background: hsl(0,0%,100%,0.25); }
    .modal-nav.prev { left: 1.4rem; }
    .modal-nav.next { right: 1.4rem; }

    .modal-counter {
        position: fixed;
        bottom: 1.4rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.78rem;
        color: white;
        opacity: 0.5;
        background: hsl(0,0%,0%,0.5);
        padding: 0.25rem 0.8rem;
        border-radius: 100vh;
    }

    /* ── Page Controls ───────────────────── */

	    .back-btn {
	        min-width: 2.45rem;
	        height: 2.45rem;
	        padding-inline: 0.82rem;
	        border-radius: 100vh;
	        background: hsl(212, 24%, 12%, 0.42);
	        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
	        color: hsl(0, 0%, 100%, 0.88);
	        display: flex;
	        align-items: center;
        justify-content: center;
        gap: 0.45rem;
	        font-size: 0.85rem;
	        font-weight: 700;
	        cursor: pointer;
	        flex-shrink: 0;
	        backdrop-filter: blur(18px) saturate(1.18);
	        -webkit-backdrop-filter: blur(18px) saturate(1.18);
	        box-shadow:
	            0 12px 30px hsl(0, 0%, 0%, 0.24),
	            inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
	        transition: background 120ms, color 120ms, outline-color 120ms, transform 120ms;
	    }

	    .back-btn:hover {
	        background: hsl(212, 28%, 18%, 0.58);
	        outline-color: hsl(212, 74%, 58%, 0.34);
	        color: white;
	        transform: translateY(-1px);
	    }

    .hero-back {
        position: absolute;
        top: 1.2rem;
        left: 1.2rem;
        z-index: 3;
    }

    /* ── Hero ────────────────────────────── */

	    .hero {
	        position: relative;
	        height: clamp(27rem, 42vw, 34rem);
	        border-radius: 1.2rem;
	        overflow: hidden;
	        background: var(--l1);
	        outline: solid 1pt var(--l3);
	    }

	    .hero-media {
	        position: absolute;
	        inset: 0;
	        width: 100%;
	        height: 100%;
	        object-fit: cover;
	        object-position: center;
	        display: block;
	    }

    .hero-gradient {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(to right, hsl(0,0%,0%,0.9) 0%, hsl(0,0%,0%,0.65) 40%, hsl(0,0%,0%,0.1) 100%),
            linear-gradient(to top,   hsl(0,0%,0%,0.7) 0%, transparent 60%);
    }

    .hero-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 2rem 2.4rem;
        gap: 0.65rem;
    }

    .hero-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }

	    .genre-chip {
	        font-size: 0.65rem;
	        font-weight: 700;
	        text-transform: uppercase;
	        letter-spacing: 0.07em;
	        padding: 0.2rem 0.6rem;
	        background: hsl(212, 24%, 12%, 0.42);
	        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
	        border-radius: 100vh;
	        backdrop-filter: blur(18px) saturate(1.18);
	        -webkit-backdrop-filter: blur(18px) saturate(1.18);
	        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
	        color: white;
	    }

    .hero-title {
        font-size: 2.8rem;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: 0;
        text-shadow: 0 2px 12px hsl(0,0%,0%,0.6);
        max-width: 80%;
        margin: 0;
        color: white;
    }

    .hero-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        opacity: 0.7;
        color: white;
    }

    .dot-sep { opacity: 0.5; }

    .hero-stats {
        display: flex;
        align-items: stretch;
        gap: 0.55rem;
        flex-wrap: wrap;
        max-width: min(56rem, 100%);
        margin-top: 0.7rem;
    }

	    .hero-stat {
	        min-width: 7rem;
	        padding: 0.62rem 0.78rem;
	        border-radius: 0.7rem;
	        background: hsl(212, 24%, 12%, 0.42);
	        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
	        display: flex;
	        flex-direction: column;
	        gap: 0.24rem;
	        backdrop-filter: blur(18px) saturate(1.18);
	        -webkit-backdrop-filter: blur(18px) saturate(1.18);
	        box-shadow:
	            0 12px 28px hsl(0, 0%, 0%, 0.22),
	            inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
	    }

	    .hero-stat.live {
	        background: hsl(212, 70%, 42%, 0.24);
	        outline-color: hsl(212, 74%, 58%, 0.34);
	    }

    .hero-stat-value {
        color: white;
        font-size: 1.05rem;
        font-weight: 800;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .hero-stat-label {
        color: white;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        opacity: 0.54;
        white-space: nowrap;
    }

    /* ── Content grid ────────────────────── */

	    .content-grid {
	        display: grid;
	        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
	        gap: 1.4rem;
	        align-items: start;
	    }

	    .main-col { display: flex; flex-direction: column; gap: 1.2rem; }
	    .info-col  { display: flex; flex-direction: column; gap: 1rem; position: static; }

    /* ── Panels ──────────────────────────── */

    .panel {
        background: linear-gradient(180deg, hsl(212, 26%, 15%, 0.62) 0%, hsl(212, 24%, 12%, 0.54) 100%);
        border-radius: 1.1rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.52);
        padding: 1.3rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        backdrop-filter: blur(26px) saturate(1.24);
        -webkit-backdrop-filter: blur(26px) saturate(1.24);
        box-shadow:
            0 16px 42px hsl(0, 0%, 0%, 0.18),
            inset 0 1px 0 hsl(0, 0%, 100%, 0.075);
    }

    .panel-label {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.5;
    }

    /* ── Description ─────────────────────── */

	    .description {
	        font-size: 0.9rem;
	        line-height: 1.65;
	        opacity: 0.82;
	        margin: 0;
	    }

	    .snapshot-grid {
	        display: grid;
	        grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
	        gap: 0.8rem;
	    }

	    .snapshot-card {
	        display: flex;
	        flex-direction: column;
	        gap: 0.35rem;
	        min-height: 7rem;
	        padding: 0.95rem 1rem;
	        border-radius: 0.85rem;
	        background: hsl(212, 24%, 12%, 0.42);
	        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
	        backdrop-filter: blur(18px) saturate(1.18);
	        -webkit-backdrop-filter: blur(18px) saturate(1.18);
	        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
	    }

	    .snapshot-label {
	        font-size: 0.64rem;
	        font-weight: 800;
	        text-transform: uppercase;
	        letter-spacing: 0.08em;
	        opacity: 0.48;
	    }

	    .snapshot-value {
	        font-size: 1.1rem;
	        font-weight: 800;
	        line-height: 1.1;
	        color: white;
	    }

	    .snapshot-note {
	        font-size: 0.74rem;
	        line-height: 1.45;
	        opacity: 0.58;
	    }

    /* ── Trailers ────────────────────────── */

    .videos-list { display: flex; flex-direction: column; gap: 0.8rem; }

    .video-wrap { display: flex; flex-direction: column; gap: 0.4rem; }

    .trailer-video {
        width: 100%;
        border-radius: 0.65rem;
        background: var(--l2);
        outline: solid 1pt var(--l3);
        aspect-ratio: 16 / 9;
        display: block;
    }

    .video-label { font-size: 0.75rem; opacity: 0.45; padding-left: 0.2rem; }

    /* ── Screenshots ─────────────────────── */

	    .screenshots-scroll {
	        --left-fade-width: 0rem;
	        --right-fade-width: 4rem;
	        gap: 0.6rem;
	        padding-top: 4pt;
	        padding-bottom: 0.5rem;
	        padding-left: 1px;
	        padding-right: 4rem;
	        -webkit-mask-image: linear-gradient(
	            to right,
	            transparent 0,
	            black var(--left-fade-width),
	            black calc(100% - var(--right-fade-width)),
	            transparent 100%
	        );
	        mask-image: linear-gradient(
	            to right,
	            transparent 0,
	            black var(--left-fade-width),
	            black calc(100% - var(--right-fade-width)),
	            transparent 100%
	        );
	    }

    .ss-btn {
        flex-shrink: 0;
        border-radius: 0.5rem;
        overflow: hidden;
        display: block;
        outline: solid 1pt transparent;
        transition: outline-color 140ms, transform 140ms;
        cursor: pointer;
        position: relative;
        padding: 0;
        background: none;
    }

    .ss-btn:hover {
        outline-color: var(--accent);
        transform: translateY(-2px);
    }

    .ss-img {
        height: 8rem;
        width: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        display: block;
    }

    .ss-hover-overlay {
        position: absolute;
        inset: 0;
        background: hsl(0,0%,0%,0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        color: white;
        opacity: 0;
        transition: opacity 140ms;
    }

    .ss-btn:hover .ss-hover-overlay { opacity: 1; }

    /* ── Achievements ────────────────────── */

    .ach-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ach-fraction { display: flex; align-items: baseline; gap: 0.2rem; }
    .ach-earned { font-size: 1.4rem; font-weight: 800; color: var(--bright-accent); }
    .ach-total  { font-size: 0.8rem; opacity: 0.5; }

    .ach-bar-track {
        height: 0.4rem;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .ach-bar-fill {
        height: 100%;
        background: linear-gradient(to right, var(--soft-accent), var(--bright-accent));
        border-radius: 100vh;
        transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .ach-pct { font-size: 0.73rem; opacity: 0.5; margin-top: -0.3rem; }

    .ach-sublabel {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.4;
        padding-top: 0.3rem;
        border-top: 1pt solid var(--l2);
    }

    .ach-grid { display: flex; flex-direction: column; gap: 0.25rem; }

    .ach-item {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.4rem 0.5rem;
        border-radius: 0.6rem;
        transition: background 120ms;
        cursor: default;
    }

    .ach-item:hover { background: var(--l1); }

    .ach-icon {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.3rem;
        flex-shrink: 0;
        object-fit: cover;
    }

    .ach-icon-ph {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.3rem;
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        opacity: 0.4;
        flex-shrink: 0;
    }

    .ach-info { min-width: 0; }

    .ach-name {
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ach-rarity { font-size: 0.68rem; color: var(--bright-accent); opacity: 0.85; }

    /* ── News ────────────────────────────── */

    .news-list { display: flex; flex-direction: column; gap: 0.3rem; }

    .news-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        padding: 0.8rem 0.9rem;
        border-radius: 0.8rem;
        outline: solid 1pt transparent;
        transition: background 140ms, outline-color 140ms;
        text-decoration: none;
    }

    .news-item:hover { background: var(--l1); outline-color: var(--l3); }

    .news-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .news-source {
        font-size: 0.63rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--bright-accent);
        opacity: 0.8;
    }

    .news-date { font-size: 0.68rem; opacity: 0.4; white-space: nowrap; }

    .news-title {
        font-size: 0.88rem;
        font-weight: 600;
        line-height: 1.35;
    }

    .news-snippet {
        font-size: 0.75rem;
        opacity: 0.5;
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* ── Action panel ────────────────────── */

    .action-panel { gap: 0.6rem; }

    .btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 150ms, transform 80ms;
        text-decoration: none;
        box-sizing: border-box;
    }

    .btn-play-game {
        background: var(--accent);
        color: white;
    }

    .btn-play-game:hover { background: var(--bright-accent); transform: scale(1.01); }

    .btn-buy {
        background: hsl(130,50%,22%);
        color: hsl(130,65%,62%);
        outline: solid 1pt hsl(130,45%,32%);
    }

    .btn-buy:hover { background: hsl(130,50%,26%); transform: scale(1.01); }

    .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.65rem 1rem;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        border-radius: 0.75rem;
        font-size: 0.88rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: background 150ms, outline-color 150ms;
        box-sizing: border-box;
    }

    .btn-secondary:hover { background: var(--l2); outline-color: var(--l4); }

    .discount-badge {
        background: hsl(130,60%,25%);
        color: hsl(130,65%,55%);
        font-size: 0.62rem;
        font-weight: 700;
        padding: 0.12rem 0.4rem;
        border-radius: 0.3rem;
    }

    .orig-price { font-size: 0.72rem; opacity: 0.4; text-align: center; text-decoration: line-through; }

    /* ── Playtime ────────────────────────── */

    .playtime-big {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--bright-accent);
        line-height: 1;
    }

    .playtime-sub { font-size: 0.72rem; opacity: 0.45; margin-top: -0.3rem; }

    /* ── Friends in game ─────────────────── */

    .friends-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .friend-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.4rem 0.5rem;
        border-radius: 0.55rem;
        transition: background 120ms;
    }

    .friend-row:hover { background: var(--l1); }

    .friend-av-wrap {
        position: relative;
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
    }

    .friend-av {
        width: 100%;
        height: 100%;
        border-radius: 0.3rem;
        object-fit: cover;
        display: block;
        background: var(--l3);
    }

    .friend-dot {
        position: absolute;
        bottom: -0.15rem;
        right: -0.15rem;
        width: 0.6rem;
        height: 0.6rem;
        border-radius: 50%;
        background: var(--accent);
        border: 2px solid var(--lb0);
    }

    .friend-name {
        font-size: 0.83rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Metacritic ──────────────────────── */

    .meta-score-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .meta-score {
        font-size: 1.8rem;
        font-weight: 800;
        line-height: 1;
        width: 3rem;
        height: 3rem;
        border-radius: 0.55rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .meta-score.great { background: hsl(130,50%,22%); color: hsl(130,65%,55%); }
    .meta-score.mixed { background: hsl(45,60%,22%);  color: hsl(45,80%,55%);  }
    .meta-score.poor  { background: hsl(0,50%,22%);   color: hsl(0,65%,55%);   }

    .meta-link {
        font-size: 0.78rem;
        color: var(--bright-accent);
        opacity: 0.7;
        text-decoration: none;
        transition: opacity 120ms;
    }

    .meta-link:hover { opacity: 1; }
    .meta-link.muted { color: inherit; opacity: 0.42; }

    /* ── HLTB ────────────────────────────── */

    .hltb-list { display: flex; flex-direction: column; gap: 0.1rem; }

    .hltb-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.45rem 0.4rem;
        border-radius: 0.5rem;
        transition: background 120ms;
    }

    .hltb-row:hover { background: var(--l1); }
    .hltb-key { font-size: 0.82rem; opacity: 0.65; }
    .hltb-val { font-size: 0.82rem; font-weight: 700; }

    /* ── Game detail rows ────────────────── */

    .detail-rows { display: flex; flex-direction: column; gap: 0.1rem; }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 0.8rem;
        padding: 0.35rem 0.4rem;
        border-radius: 0.4rem;
        transition: background 120ms;
    }

	    .detail-row:hover { background: var(--l1); }
	    .detail-key { font-size: 0.78rem; opacity: 0.5; white-space: nowrap; flex-shrink: 0; }
	    .detail-val { font-size: 0.78rem; font-weight: 500; text-align: right; word-break: break-word; }

    .chip-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }

    .chip {
        font-size: 0.68rem;
        padding: 0.22rem 0.6rem;
        background: var(--la1);
        color: var(--bright-accent);
        outline: solid 1pt var(--la3);
        border-radius: 100vh;
        font-weight: 600;
    }

    .chip.dim {
        background: var(--l1);
        color: inherit;
        outline-color: var(--l3);
        opacity: 0.65;
    }

    @media (max-width: 900px) {
        .content-grid {
            grid-template-columns: minmax(0, 1fr);
        }

        .info-col {
            position: static;
        }

        .hero {
            height: 30rem;
        }

        .hero-content {
            padding: 1.5rem;
        }

        .hero-title {
            max-width: 100%;
            font-size: 2.25rem;
        }

        .hero-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
        }

        .hero-stat {
            min-width: 0;
        }
    }

    @media (max-width: 520px) {
        .hero {
            height: 34rem;
            border-radius: 0.9rem;
        }

        .hero-content {
            padding: 1.1rem;
        }

        .hero-title {
            font-size: 1.85rem;
        }

        .hero-stats {
            grid-template-columns: minmax(0, 1fr);
            gap: 0.45rem;
        }

        .hero-stat {
            padding: 0.55rem 0.68rem;
        }

        .panel {
            border-radius: 0.9rem;
            padding: 1rem;
        }
    }

    /* ── Loading skeletons ───────────────── */

    .sk-hero {
        height: clamp(27rem, 42vw, 34rem);
        border-radius: 1.2rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-col { display: flex; flex-direction: column; gap: 1.2rem; }

    .sk-panel {
        height: 8rem;
        border-radius: 1.1rem;
        background: linear-gradient(90deg, var(--l1) 0%, var(--l2) 50%, var(--l1) 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
    }

    .sk-panel.sm { height: 5rem; }

    @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* ── Not found ───────────────────────── */

    .not-found {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 4rem;
        font-size: 0.9rem;
        opacity: 0.4;
    }

    .not-found i { font-size: 1.5rem; }
</style>
