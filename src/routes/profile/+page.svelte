<script>
    import { db, clearCache } from '$lib/data'
    import { auth } from '$lib/auth'
    import { startCacheUpdateCycle } from '$lib/cache'
    import { signOut } from 'firebase/auth'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import JsonNode from '$lib/components/JsonNode.svelte'

    // ── Reactive state ───────────────────────────────────────────────────────

    let fireUser   = $derived($db?.user)
    let steamUser  = $derived($db?.cache?.user?.data ?? null)
    let savedID    = $derived($db?.steamID ?? '')

    let inputID    = $state('')
    let saveStatus = $state(null)
    let activeNav  = $state('account')
    let dbExpanded = $state(false)

    $effect(() => { if (savedID && !inputID) inputID = savedID })

    // ── Avatar / name resolution ─────────────────────────────────────────────

    let avatar = $derived(steamUser?.avatarfull ?? fireUser?.photoURL ?? null)
    let steamAvatar = $derived(steamUser?.avatarfull ?? null)
    let googleAvatar = $derived(fireUser?.photoURL ?? null)
    let displayName = $derived(steamUser?.personaname ?? fireUser?.displayName ?? 'User')
    let email = $derived(fireUser?.email ?? '')

    // ── Steam derived data ───────────────────────────────────────────────────

    let librarySize  = $derived($db?.cache?.library?.ids?.length ?? 0)
    let totalMinutes = $derived(() => {
        const pt = $db?.cache?.library?.playtime ?? {}
        return Object.values(pt).reduce((s, m) => s + m, 0)
    })
    let totalHours   = $derived(Math.round(totalMinutes() / 60))
    let playedCount  = $derived(() => {
        const pt = $db?.cache?.library?.playtime ?? {}
        return Object.values(pt).filter(m => m > 0).length
    })
    let mostPlayedGame = $derived(() => {
        const pt = $db?.cache?.library?.playtime ?? {}
        const details = $db?.game_details ?? {}
        const top = Object.entries(pt).sort(([,a],[,b]) => b - a)[0]
        if (!top) return null
        const [id, mins] = top
        return { name: details[id]?.data?.name ?? `App ${id}`, hours: Math.round(mins / 60) }
    })

    let steamVisibility = $derived(() => {
        const v = steamUser?.communityvisibilitystate
        if (v === 3) return 'Public'
        if (v === 2) return 'Friends Only'
        if (v === 1) return 'Private'
        return '—'
    })

    let accountCreated = $derived(() => {
        const t = steamUser?.timecreated
        if (!t) return null
        return new Date(t * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    })

    let lastLogoff = $derived(() => {
        const t = steamUser?.lastlogoff
        if (!t) return null
        const secs = Math.floor(Date.now() / 1000) - t
        if (secs < 60)     return 'just now'
        if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    })

    // Google auth metadata
    let googleCreated  = $derived(fireUser?.metadata?.creationTime ?? null)
    let googleLastSign = $derived(fireUser?.metadata?.lastSignInTime ?? null)
    let googleProvider = $derived(fireUser?.providerData?.[0]?.providerId ?? null)
    let emailVerified  = $derived(fireUser?.emailVerified ?? false)

    // ── Helpers ──────────────────────────────────────────────────────────────

    const ID_REGEX = /^\d{17}$/
    let isDirty  = $derived(inputID.trim() !== savedID)
    let isValid  = $derived(ID_REGEX.test(inputID.trim()))
    let willWipe = $derived(isDirty && isValid)

    function saveChanges() {
        const trimmed = inputID.trim()
        if (!ID_REGEX.test(trimmed)) { saveStatus = 'error'; setTimeout(() => saveStatus = null, 3000); return }
        const changed = trimmed !== savedID
        db.update(data => {
            if (changed) { data.cache = {}; data.algr = {}; data.game_details = {} }
            data.steamID = trimmed
            return data
        })
        if (changed) startCacheUpdateCycle()
        saveStatus = 'saved'
        setTimeout(() => saveStatus = null, 2500)
    }

    function resetChanges() { inputID = savedID; saveStatus = null }

    function refreshLibrary() {
        clearCache()
        startCacheUpdateCycle()
        saveStatus = 'refreshed'
        setTimeout(() => saveStatus = null, 2500)
    }

    async function logout() {
        await signOut(auth)
        db.update(d => { d.user = {}; return d })
        goto(resolve('/login'))
    }

    const NAV = [
        { id: 'account',     label: 'Your Account', icon: 'user'     },
        { id: 'data',        label: 'Data & Cache',  icon: 'database' },
        { id: 'preferences', label: 'Preferences',   icon: 'sliders'  },
    ]

    // ── Preferences ──────────────────────────────────────────────────────────

    const GENRES = [
        'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports',
        'Racing', 'Puzzle', 'Horror', 'Indie', 'Casual', 'Multiplayer',
        'Story Rich', 'Open World', 'Shooter', 'Platformer', 'Stealth',
        'Survival', 'Tower Defense', 'Visual Novel',
    ]

    let prefs           = $derived($db?.prefs ?? {})
    let preferredGenres = $derived(prefs.genres?.preferred ?? [])
    let excludedGenres  = $derived(prefs.genres?.excluded  ?? [])
    let refreshHours    = $derived(prefs.suggestions?.refreshHours ?? 24)
    let aiTone          = $derived(prefs.suggestions?.aiTone ?? 'brief')
    let maxResults      = $derived(prefs.suggestions?.maxResults ?? 9)
    let compactLibrary  = $derived(prefs.display?.compactLibrary ?? false)
    let accentColor     = $derived(prefs.display?.accentColor ?? 'default')
    let defaultSort     = $derived(prefs.library?.defaultSort ?? 'None')
    let defaultFilter   = $derived(prefs.library?.defaultFilter ?? 'All')
    let shareActivity   = $derived(prefs.privacy?.shareActivity ?? true)

    // Dashboard section toggles
    let dash = $derived(prefs.dashboard ?? {})
    let showContinuePlaying = $derived(dash.showContinuePlaying ?? true)
    let showRecentlyPlayed  = $derived(dash.showRecentlyPlayed  ?? true)
    let showSuggestions     = $derived(dash.showSuggestions     ?? true)
    let showNews            = $derived(dash.showNews            ?? true)
    let showStats           = $derived(dash.showStats           ?? true)
    let showActivity        = $derived(dash.showActivity        ?? true)

    function setPref(path, value) {
        db.update(data => {
            data.prefs ??= {}
            const parts = path.split('.')
            let obj = data.prefs
            for (let i = 0; i < parts.length - 1; i++) { obj[parts[i]] ??= {}; obj = obj[parts[i]] }
            obj[parts[parts.length - 1]] = value
            return data
        })
    }

    function invalidateSuggestions() {
        db.update(data => {
            const s = data.cache?.suggestions
            if (s?.play) s.play.generatedAt = 0
            if (s?.buy)  s.buy.generatedAt  = 0
            return data
        })
    }

    function genreState(genre) {
        if (preferredGenres.includes(genre)) return 'preferred'
        if (excludedGenres.includes(genre))  return 'excluded'
        return 'neutral'
    }

    function cycleGenre(genre) {
        const state = genreState(genre)
        if (state === 'neutral') {
            setPref('genres.preferred', [...preferredGenres, genre])
        } else if (state === 'preferred') {
            setPref('genres.preferred', preferredGenres.filter(g => g !== genre))
            setPref('genres.excluded',  [...excludedGenres, genre])
        } else {
            setPref('genres.excluded', excludedGenres.filter(g => g !== genre))
        }
        invalidateSuggestions()
    }

    let prefsSaved = $state(false)
    function savePref(path, value) {
        setPref(path, value)
        invalidateSuggestions()
        prefsSaved = true
        setTimeout(() => prefsSaved = false, 2000)
    }
</script>

<div class="profile-page">

    <!-- ── Sidebar ───────────────────────────────────── -->
    <aside class="sidebar">
        <div class="identity">
            {#if avatar}
                <img class="avatar" src={avatar} alt="" />
            {:else}
                <div class="avatar-placeholder"><i class="fa-solid fa-user"></i></div>
            {/if}
            <div class="display-name">{displayName}</div>
            {#if email}<div class="email">{email}</div>{/if}
        </div>

        <nav class="sidebar-nav">
            {#each NAV as item}
                <button
                    class="nav-item {activeNav === item.id ? 'active' : ''}"
                    onclick={() => activeNav = item.id}
                >
                    <i class="fa-solid fa-{item.icon}"></i>
                    {item.label}
                </button>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <button class="nav-item danger" onclick={logout}>
                <i class="fa-solid fa-right-from-bracket"></i>
                Sign Out
            </button>
        </div>
    </aside>

    <!-- ── Main Content ───────────────────────────────────── -->
    <main class="main-content">

        <!-- ══ ACCOUNT ══ -->
        {#if activeNav === 'account'}

        <!-- Steam Profile Hero -->
        {#if steamUser}
        <section class="panel hero-panel">
            <div class="steam-hero">
                <img class="steam-avatar-lg" src={steamUser.avatarfull} alt="" />
                <div class="steam-hero-info">
                    <div class="steam-name">{steamUser.personaname}</div>
                    {#if steamUser.realname}
                        <div class="steam-realname">{steamUser.realname}</div>
                    {/if}
                    <div class="steam-pills">
                        <span class="spill">
                            <i class="fa-solid fa-shield"></i>
                            {steamVisibility()}
                        </span>
                        {#if steamUser.loccountrycode}
                            <span class="spill">
                                <i class="fa-solid fa-location-dot"></i>
                                {steamUser.loccountrycode}
                            </span>
                        {/if}
                        {#if lastLogoff()}
                            <span class="spill dim">
                                <i class="fa-solid fa-clock"></i>
                                Last seen {lastLogoff()}
                            </span>
                        {/if}
                    </div>
                </div>
                {#if steamUser.profileurl}
                    <a class="steam-profile-link" href={steamUser.profileurl} target="_blank" rel="noopener">
                        <i class="fa-brands fa-steam"></i>
                        View Profile
                    </a>
                {/if}
            </div>
        </section>
        {/if}

        <!-- Library Stats -->
        {#if librarySize > 0}
        <section class="panel stats-panel">
            <h3 class="panel-subheading">
                <i class="fa-solid fa-chart-bar"></i>
                Library Stats
            </h3>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-num">{librarySize.toLocaleString()}</div>
                    <div class="stat-lbl">Games Owned</div>
                </div>
                <div class="stat-box accent">
                    <div class="stat-num">{playedCount().toLocaleString()}</div>
                    <div class="stat-lbl">Games Played</div>
                </div>
                <div class="stat-box">
                    <div class="stat-num">{totalHours >= 1000 ? `${(totalHours/1000).toFixed(1)}k` : totalHours.toLocaleString()}</div>
                    <div class="stat-lbl">Total Hours</div>
                </div>
                <div class="stat-box dim">
                    <div class="stat-num">{librarySize - playedCount()}</div>
                    <div class="stat-lbl">Never Played</div>
                </div>
            </div>
            {#if mostPlayedGame()}
                <div class="top-game-row">
                    <i class="fa-solid fa-trophy"></i>
                    Most played: <strong>{mostPlayedGame().name}</strong>
                    <span class="muted">— {mostPlayedGame().hours.toLocaleString()}h</span>
                </div>
            {/if}
        </section>
        {/if}

        <!-- Steam ID + Account details -->
        <section class="panel">
            <h2 class="panel-heading">Steam Account</h2>

            <div class="form-grid">
                <div class="field">
                    <label class="field-label" for="steam-id">
                        Steam ID
                        <span class="hint">17-digit number</span>
                    </label>
                    <input
                        id="steam-id"
                        class="field-val {saveStatus === 'error' ? 'err' : ''}"
                        type="text"
                        inputmode="numeric"
                        placeholder="76561198000000000"
                        maxlength="17"
                        bind:value={inputID}
                        onkeydown={(e) => e.key === 'Enter' && saveChanges()}
                    />
                </div>

                <div class="field">
                    <div class="field-label">Steam Username</div>
                    <div class="field-val readonly">{steamUser?.personaname ?? '—'}</div>
                </div>

                {#if accountCreated()}
                <div class="field">
                    <div class="field-label">Account Created</div>
                    <div class="field-val readonly">{accountCreated()}</div>
                </div>
                {/if}

                {#if steamUser?.loccountrycode}
                <div class="field">
                    <div class="field-label">Country</div>
                    <div class="field-val readonly">{steamUser.loccountrycode}</div>
                </div>
                {/if}

                <div class="field">
                    <div class="field-label">Profile Visibility</div>
                    <div class="field-val readonly">{steamVisibility()}</div>
                </div>

                <div class="field">
                    <div class="field-label">Steam Profile</div>
                    {#if steamUser?.profileurl}
                        <a class="field-val steam-link" href={steamUser.profileurl} target="_blank" rel="noopener">
                            View on Steam
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    {:else if savedID}
                        <div class="field-val readonly muted">Loading…</div>
                    {:else}
                        <div class="field-val readonly muted">Enter Steam ID above</div>
                    {/if}
                </div>
            </div>

            {#if isDirty && inputID.trim().length > 0 && !isValid}
                <p class="notice warn">Steam ID must be exactly 17 digits.</p>
            {:else if willWipe}
                <p class="notice info">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Changing your Steam ID will clear all cached library data.
                </p>
            {/if}

            <div class="btn-row">
                <button class="btn-primary" onclick={saveChanges}>
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save Changes
                </button>
                <button class="btn-ghost" onclick={resetChanges}>Reset</button>
                {#if saveStatus === 'saved'}
                    <span class="status ok"><i class="fa-solid fa-circle-check"></i> Saved</span>
                {:else if saveStatus === 'error'}
                    <span class="status err-msg"><i class="fa-solid fa-circle-xmark"></i> Invalid Steam ID</span>
                {/if}
            </div>
        </section>

        <!-- Google Account -->
        <section class="panel">
            <h2 class="panel-heading">Google Account</h2>
            <div class="google-header">
                {#if googleAvatar}
                    <img class="google-avatar" src={googleAvatar} alt="" />
                {:else}
                    <div class="google-avatar-ph"><i class="fa-brands fa-google"></i></div>
                {/if}
                <div>
                    <div class="google-name">{fireUser?.displayName ?? '—'}</div>
                    <div class="google-email">{email}</div>
                </div>
            </div>
            <div class="form-grid">
                <div class="field">
                    <div class="field-label">User ID</div>
                    <div class="field-val readonly uid">{fireUser?.uid ?? '—'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Sign-in Provider</div>
                    <div class="field-val readonly provider">
                        {#if googleProvider === 'google.com'}
                            <i class="fa-brands fa-google"></i> Google
                        {:else}
                            {googleProvider ?? '—'}
                        {/if}
                    </div>
                </div>
                <div class="field">
                    <div class="field-label">Email Verified</div>
                    <div class="field-val readonly {emailVerified ? 'verified' : 'unverified'}">
                        {#if emailVerified}
                            <i class="fa-solid fa-circle-check"></i> Verified
                        {:else}
                            <i class="fa-solid fa-circle-xmark"></i> Not Verified
                        {/if}
                    </div>
                </div>
                {#if googleCreated}
                <div class="field">
                    <div class="field-label">Account Created</div>
                    <div class="field-val readonly">{new Date(googleCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                {/if}
                {#if googleLastSign}
                <div class="field">
                    <div class="field-label">Last Sign-in</div>
                    <div class="field-val readonly">{new Date(googleLastSign).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {/if}
            </div>
        </section>

        <!-- ══ DATA & CACHE ══ -->
        {:else if activeNav === 'data'}
        <section class="panel">
            <h2 class="panel-heading">Data &amp; Cache</h2>
            <p class="panel-desc">GameSage stores your Steam library locally to speed up load times and reduce API usage.</p>

            <div class="data-grid">
                <div class="data-card">
                    <div class="data-title"><i class="fa-solid fa-rotate"></i> Refresh Library</div>
                    <p class="data-desc">Clear cached library data and re-fetch everything from Steam.</p>
                    <button class="btn-ghost" onclick={refreshLibrary}>Refresh Now</button>
                </div>
                <div class="data-card danger-card">
                    <div class="data-title"><i class="fa-solid fa-trash"></i> Clear All Cache</div>
                    <p class="data-desc">Wipes all locally stored data including your library, suggestions, and history.</p>
                    <button class="btn-danger" onclick={refreshLibrary}>Clear Cache</button>
                </div>
            </div>

            {#if saveStatus === 'refreshed'}
                <span class="status ok"><i class="fa-solid fa-circle-check"></i> Cache cleared — refreshing…</span>
            {/if}
        </section>

        <!-- Data Viewer -->
        <section class="panel viewer-panel">
            <div class="viewer-header">
                <div>
                    <h2 class="panel-heading">Data Viewer</h2>
                    <p class="panel-desc" style="margin-top: 0.3rem">Live view of the local DB store. Click any object or array to expand or collapse it.</p>
                </div>
                <button class="btn-ghost viewer-toggle" onclick={() => dbExpanded = !dbExpanded}>
                    {dbExpanded ? 'Collapse All' : 'Expand All'}
                </button>
            </div>
            <div class="json-tree">
                {#key dbExpanded}
                    <JsonNode value={$db} depth={dbExpanded ? 99 : 0} />
                {/key}
            </div>
        </section>

        <!-- ══ PREFERENCES ══ -->
        {:else if activeNav === 'preferences'}
        <section class="panel">
            <h2 class="panel-heading">Preferences</h2>

            <!-- Genre Preferences -->
            <div class="pref-section">
                <div class="pref-section-title">
                    <i class="fa-solid fa-tags"></i>
                    Genre Preferences
                </div>
                <p class="pref-section-desc">
                    Shapes your AI recommendations in real-time. Click once to prefer
                    <span class="chip-demo preferred">Action</span>,
                    again to exclude <span class="chip-demo excluded">Sports</span>, again to clear.
                </p>
                <div class="genre-chips">
                    {#each GENRES as genre}
                        {@const state = genreState(genre)}
                        <button
                            class="gchip {state}"
                            onclick={() => cycleGenre(genre)}
                            title={state === 'preferred' ? 'Preferred — click to exclude' : state === 'excluded' ? 'Excluded — click to clear' : 'Click to prefer'}
                        >
                            {#if state === 'preferred'}<i class="fa-solid fa-heart"></i>
                            {:else if state === 'excluded'}<i class="fa-solid fa-ban"></i>{/if}
                            {genre}
                        </button>
                    {/each}
                </div>
                {#if preferredGenres.length > 0 || excludedGenres.length > 0}
                    <div class="pref-active-note">
                        <i class="fa-solid fa-circle-check"></i>
                        {preferredGenres.length > 0 ? `Preferring ${preferredGenres.length} genre${preferredGenres.length !== 1 ? 's' : ''}` : ''}
                        {preferredGenres.length > 0 && excludedGenres.length > 0 ? ' · ' : ''}
                        {excludedGenres.length > 0 ? `Excluding ${excludedGenres.length} genre${excludedGenres.length !== 1 ? 's' : ''}` : ''}
                        &nbsp;— suggestions update automatically on the Suggested page.
                    </div>
                {/if}
            </div>

            <!-- AI Suggestions -->
            <div class="pref-section">
                <div class="pref-section-title">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    AI Suggestions
                </div>
                <div class="pref-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Refresh Interval</div>
                        <div class="pref-hint">How often GameSage regenerates your recommendations</div>
                    </div>
                    <div class="seg-btns">
                        {#each [6, 12, 24, 48] as h}
                            <button class="seg-btn {refreshHours === h ? 'active' : ''}" onclick={() => savePref('suggestions.refreshHours', h)}>{h}h</button>
                        {/each}
                    </div>
                </div>
                <div class="pref-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Suggestion Style</div>
                        <div class="pref-hint">Tone used when explaining why a game was recommended</div>
                    </div>
                    <div class="seg-btns">
                        {#each [['brief','Brief'], ['detailed','Detailed'], ['enthusiastic','Enthusiastic']] as [val, label]}
                            <button class="seg-btn {aiTone === val ? 'active' : ''}" onclick={() => savePref('suggestions.aiTone', val)}>{label}</button>
                        {/each}
                    </div>
                </div>
                <div class="pref-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Results per Section</div>
                        <div class="pref-hint">How many games to show in each suggestion row</div>
                    </div>
                    <div class="seg-btns">
                        {#each [6, 9, 12] as n}
                            <button class="seg-btn {maxResults === n ? 'active' : ''}" onclick={() => savePref('suggestions.maxResults', n)}>{n}</button>
                        {/each}
                    </div>
                </div>
                {#if prefsSaved}
                    <span class="status ok"><i class="fa-solid fa-circle-check"></i> Saved — suggestions update on next load</span>
                {/if}
            </div>

            <!-- Dashboard Layout -->
            <div class="pref-section">
                <div class="pref-section-title">
                    <i class="fa-solid fa-table-columns"></i>
                    Dashboard Layout
                </div>
                <p class="pref-section-desc">Choose which sections appear on your dashboard.</p>
                <div class="toggle-list">
                    {#each [
                        ['dashboard.showContinuePlaying', showContinuePlaying, 'Continue Playing'],
                        ['dashboard.showRecentlyPlayed',  showRecentlyPlayed,  'Recently Played'],
                        ['dashboard.showSuggestions',     showSuggestions,     'AI Suggestions'],
                        ['dashboard.showNews',            showNews,            'What\'s New (game news)'],
                        ['dashboard.showStats',           showStats,           'Your Stats sidebar'],
                        ['dashboard.showActivity',        showActivity,        'Friend Activity sidebar'],
                    ] as [path, val, label]}
                        <div class="pref-toggle-row">
                            <div class="pref-label">{label}</div>
                            <button
                                class="toggle {val ? 'on' : ''}"
                                onclick={() => setPref(path, !val)}
                                role="switch"
                                aria-checked={val}
                                aria-label={label}
                            ><div class="toggle-thumb"></div></button>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Library Defaults -->
            <div class="pref-section">
                <div class="pref-section-title">
                    <i class="fa-solid fa-grip"></i>
                    Library Defaults
                </div>
                <div class="pref-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Default Sort</div>
                        <div class="pref-hint">How your library is sorted when you open it</div>
                    </div>
                    <div class="seg-btns">
                        {#each [['None','Default'], ['Most Played','Most Played'], ['A → Z','A → Z']] as [val, label]}
                            <button class="seg-btn {defaultSort === val ? 'active' : ''}" onclick={() => { setPref('library.defaultSort', val); db.update(d => ({ ...d, filters: { ...d.filters, Sort: val } })) }}>{label}</button>
                        {/each}
                    </div>
                </div>
                <div class="pref-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Default Display Filter</div>
                        <div class="pref-hint">Which games are shown when you open the library</div>
                    </div>
                    <div class="seg-btns">
                        {#each [['All','All Games'], ['Never Played','Unplayed Only']] as [val, label]}
                            <button class="seg-btn {defaultFilter === val ? 'active' : ''}" onclick={() => { setPref('library.defaultFilter', val); db.update(d => ({ ...d, filters: { ...d.filters, Display: val } })) }}>{label}</button>
                        {/each}
                    </div>
                </div>
                <div class="pref-toggle-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Compact Library</div>
                        <div class="pref-hint">Smaller cards to fit more games per row</div>
                    </div>
                    <button
                        class="toggle {compactLibrary ? 'on' : ''}"
                        onclick={() => setPref('display.compactLibrary', !compactLibrary)}
                        role="switch"
                        aria-checked={compactLibrary}
                        aria-label="Compact library"
                    ><div class="toggle-thumb"></div></button>
                </div>
            </div>

            <!-- Privacy -->
            <div class="pref-section">
                <div class="pref-section-title">
                    <i class="fa-solid fa-lock"></i>
                    Privacy
                </div>
                <div class="pref-toggle-row">
                    <div class="pref-label-block">
                        <div class="pref-label">Share Activity with Friends</div>
                        <div class="pref-hint">Show your currently playing game in your friends' activity feeds</div>
                    </div>
                    <button
                        class="toggle {shareActivity ? 'on' : ''}"
                        onclick={() => setPref('privacy.shareActivity', !shareActivity)}
                        role="switch"
                        aria-checked={shareActivity}
                        aria-label="Share activity"
                    ><div class="toggle-thumb"></div></button>
                </div>
            </div>

        </section>
        {/if}

    </main>
</div>

<style>
    .profile-page {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr);
        gap: 2rem;
        align-items: start;
    }

    /* ── Sidebar ──────────────────────── */

    .sidebar {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        position: sticky;
        top: 2.4rem;
        width: max-content;
        min-width: 11rem;
    }

    .identity {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.3rem;
        padding-bottom: 1rem;
        border-bottom: 1pt solid var(--l2);
        margin-bottom: 0.5rem;
    }

    .avatar {
        width: 3.8rem;
        height: 3.8rem;
        border-radius: 50%;
        object-fit: cover;
        outline: 2px solid var(--la3);
        margin-bottom: 0.25rem;
    }

    .avatar-placeholder {
        width: 3.8rem;
        height: 3.8rem;
        border-radius: 50%;
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        opacity: 0.35;
        margin-bottom: 0.25rem;
    }

    .display-name { font-size: 0.88rem; font-weight: 700; white-space: nowrap; }
    .email        { font-size: 0.68rem; opacity: 0.4; white-space: nowrap; }

    .sidebar-nav { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0.7rem;
        border-radius: 0.55rem;
        font-size: 0.84rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 120ms;
        white-space: nowrap;
        color: inherit;
        opacity: 0.65;
    }

    .nav-item i { width: 0.9rem; text-align: center; font-size: 0.75rem; flex-shrink: 0; }
    .nav-item:hover  { background: var(--l1); opacity: 1; }
    .nav-item.active { background: var(--la1); color: var(--bright-accent); opacity: 1; outline: solid 1pt var(--la2); }
    .nav-item.danger { color: hsl(0, 60%, 65%); opacity: 0.75; }
    .nav-item.danger:hover { background: hsl(0, 50%, 18%, 0.5); opacity: 1; }

    .sidebar-footer { border-top: 1pt solid var(--l2); padding-top: 0.7rem; margin-top: 0.3rem; }

    /* ── Main ─────────────────────────── */

    .main-content { display: flex; flex-direction: column; gap: 1.4rem; }

    .panel {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    .panel-heading    { font-size: 1.4rem; font-weight: 700; margin: 0; }
    .panel-subheading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.5;
        margin: 0;
    }
    .panel-desc { font-size: 0.86rem; opacity: 0.55; line-height: 1.6; margin: 0; }

    /* ── Steam Hero ───────────────────── */

    .hero-panel { padding: 1.4rem; }

    .steam-hero {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        flex-wrap: wrap;
    }

    .steam-avatar-lg {
        width: 5rem;
        height: 5rem;
        border-radius: 0.65rem;
        object-fit: cover;
        outline: 2px solid var(--la3);
        flex-shrink: 0;
    }

    .steam-hero-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.45rem; }

    .steam-name { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.01em; }
    .steam-realname { font-size: 0.85rem; opacity: 0.5; }

    .steam-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .spill {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.22rem 0.65rem;
        background: var(--l1);
        border-radius: 100vh;
        outline: solid 1pt var(--l3);
        font-size: 0.73rem;
        font-weight: 600;
    }

    .spill i { font-size: 0.65rem; }
    .spill.dim { opacity: 0.5; }

    .steam-profile-link {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.5rem 1rem;
        background: var(--la1);
        border-radius: 0.6rem;
        outline: solid 1pt var(--la3);
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--bright-accent);
        transition: background 120ms;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .steam-profile-link:hover { background: var(--la2); }
    .steam-profile-link i { font-size: 0.9rem; }

    /* ── Library Stats ────────────────── */

    .stats-panel { gap: 1rem; }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.8rem;
    }

    .stat-box {
        background: var(--l1);
        border-radius: 0.75rem;
        outline: solid 1pt var(--l3);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .stat-box.accent { background: var(--la1); outline-color: var(--la3); }
    .stat-box.dim .stat-num { opacity: 0.45; }

    .stat-num { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
    .stat-box.accent .stat-num { color: var(--bright-accent); }

    .stat-lbl { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.45; margin-top: 0.15rem; }

    .top-game-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        opacity: 0.65;
        flex-wrap: wrap;
    }

    .top-game-row i { color: var(--bright-accent); font-size: 0.75rem; }
    .top-game-row strong { font-weight: 700; opacity: 1; color: inherit; }
    .muted { opacity: 0.45; }

    /* ── Google Account ───────────────── */

    .google-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--l1);
        border-radius: 0.75rem;
        outline: solid 1pt var(--l3);
    }

    .google-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .google-avatar-ph {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        opacity: 0.4;
        flex-shrink: 0;
    }

    .google-name  { font-size: 0.95rem; font-weight: 700; }
    .google-email { font-size: 0.78rem; opacity: 0.5; margin-top: 0.1rem; }

    /* ── Form ─────────────────────────── */

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }

    .field-label {
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.5;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .hint { font-size: 0.7rem; font-weight: 400; opacity: 0.7; text-transform: none; letter-spacing: 0; }

    .field-val {
        padding: 0.6rem 0.85rem;
        background: var(--l1);
        border-radius: 0.55rem;
        outline: solid 1pt var(--l3);
        font-size: 0.88rem;
        font-family: inherit;
        color: var(--contrast);
        transition: outline-color 150ms;
        box-sizing: border-box;
        width: 100%;
        display: block;
    }

    .field-val:focus    { outline-color: var(--accent); }
    .field-val.readonly { opacity: 0.5; cursor: default; }
    .field-val.muted    { opacity: 0.35; font-style: italic; }
    .field-val.err      { outline-color: var(--warning); }
    .field-val.uid      { font-family: monospace; font-size: 0.75rem; word-break: break-all; }
    .field-val.provider { display: flex; align-items: center; gap: 0.45rem; }
    .field-val.verified   { color: hsl(130, 55%, 60%); opacity: 1; display: flex; align-items: center; gap: 0.4rem; }
    .field-val.unverified { color: hsl(0, 60%, 65%); opacity: 1; display: flex; align-items: center; gap: 0.4rem; }

    .steam-link {
        display: flex; align-items: center; justify-content: space-between;
        color: var(--bright-accent); cursor: pointer; opacity: 1;
    }
    .steam-link:hover { outline-color: var(--bright-accent); }
    .steam-link i { font-size: 0.72rem; opacity: 0.6; }

    /* ── Notices ──────────────────────── */

    .notice { font-size: 0.8rem; margin: 0; display: flex; align-items: center; gap: 0.45rem; line-height: 1.5; }
    .notice.warn { color: hsl(0, 60%, 65%); }
    .notice.info { color: hsl(38, 80%, 65%); }

    /* ── Buttons ──────────────────────── */

    .btn-row { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }

    .btn-primary {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.6rem 1.4rem; background: var(--accent);
        border-radius: 0.55rem; font-size: 0.88rem; font-weight: 600;
        cursor: pointer; color: white; transition: background 150ms;
    }
    .btn-primary:hover { background: var(--bright-accent); }

    .btn-ghost {
        padding: 0.6rem 1.2rem; background: var(--l2);
        border-radius: 0.55rem; font-size: 0.88rem; font-weight: 500;
        cursor: pointer; color: inherit; outline: solid 1pt var(--l3); transition: background 150ms;
    }
    .btn-ghost:hover { background: var(--l3); }

    .btn-danger {
        padding: 0.6rem 1.2rem; background: hsl(0, 50%, 18%, 0.6);
        border-radius: 0.55rem; font-size: 0.88rem; font-weight: 500;
        cursor: pointer; color: hsl(0, 60%, 70%); outline: solid 1pt hsl(0, 50%, 32%);
        transition: background 150ms;
    }
    .btn-danger:hover { background: hsl(0, 50%, 24%, 0.8); }

    .status { font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
    .status.ok      { color: hsl(130, 55%, 55%); }
    .status.err-msg { color: hsl(0, 60%, 65%); }

    /* ── Data Cards ───────────────────── */

    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .data-card {
        background: var(--l1); border-radius: 0.9rem; outline: solid 1pt var(--l3);
        padding: 1.2rem; display: flex; flex-direction: column; gap: 0.65rem;
    }
    .data-card.danger-card { outline-color: hsl(0, 50%, 28%); }

    .data-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; font-weight: 700; }
    .data-desc  { font-size: 0.78rem; opacity: 0.5; line-height: 1.5; margin: 0; flex: 1; }

    /* ── Data Viewer ──────────────────── */

    .viewer-panel { gap: 1.2rem; }

    .viewer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    .viewer-toggle { flex-shrink: 0; font-size: 0.82rem; padding: 0.45rem 1rem; }

    .json-tree {
        background: hsl(220, 15%, 8%);
        border-radius: 0.75rem;
        outline: solid 1pt hsl(220, 15%, 16%);
        padding: 1.1rem 1.2rem;
        overflow-x: auto;
        max-height: 70vh;
        overflow-y: auto;
    }

    /* ── Preferences ──────────────────── */

    .pref-section {
        display: flex; flex-direction: column; gap: 1rem;
        padding-top: 1.4rem; border-top: 1pt solid var(--l2);
    }
    .pref-section:first-of-type { border-top: none; padding-top: 0; }

    .pref-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; }

    .pref-section-desc {
        font-size: 0.82rem; opacity: 0.6; line-height: 1.55; margin: 0;
        display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
    }

    .chip-demo { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 100vh; font-size: 0.72rem; font-weight: 700; }
    .chip-demo.preferred { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .chip-demo.excluded  { background: hsl(0, 50%, 18%); color: hsl(0, 70%, 65%); outline: solid 1pt hsl(0, 50%, 30%); }

    .genre-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }

    .gchip {
        display: flex; align-items: center; gap: 0.3rem;
        padding: 0.35rem 0.75rem; border-radius: 100vh;
        font-size: 0.8rem; font-weight: 600; cursor: pointer;
        transition: background 120ms, outline-color 120ms, transform 80ms;
        background: var(--l1); outline: solid 1pt var(--l3); color: inherit; opacity: 0.7;
    }
    .gchip:hover { opacity: 1; transform: scale(1.04); }
    .gchip.preferred { background: var(--la1); outline-color: var(--la3); color: var(--bright-accent); opacity: 1; }
    .gchip.excluded  { background: hsl(0, 50%, 18%); outline-color: hsl(0, 50%, 30%); color: hsl(0, 70%, 65%); opacity: 1; }
    .gchip i { font-size: 0.65rem; }

    .pref-active-note { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: hsl(130, 55%, 55%); flex-wrap: wrap; }
    .pref-active-note i { font-size: 0.72rem; flex-shrink: 0; }

    .pref-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
    .pref-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
    .toggle-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .pref-label-block { display: flex; flex-direction: column; gap: 0.2rem; }
    .pref-label { font-size: 0.88rem; font-weight: 600; }
    .pref-hint  { font-size: 0.73rem; opacity: 0.5; }

    .seg-btns {
        display: flex; background: var(--l1); border-radius: 0.55rem;
        outline: solid 1pt var(--l3); padding: 0.2rem; gap: 0.15rem; flex-shrink: 0;
    }
    .seg-btn {
        padding: 0.4rem 0.85rem; border-radius: 0.38rem; font-size: 0.8rem;
        font-weight: 600; cursor: pointer; color: inherit; opacity: 0.55;
        transition: background 120ms, opacity 120ms;
    }
    .seg-btn:hover  { opacity: 0.85; background: var(--l2); }
    .seg-btn.active { background: var(--la1); color: var(--bright-accent); opacity: 1; outline: solid 1pt var(--la3); }

    .toggle {
        width: 2.8rem; height: 1.55rem; border-radius: 100vh;
        background: var(--l3); outline: solid 1pt var(--l4);
        cursor: pointer; position: relative; transition: background 200ms, outline-color 200ms; flex-shrink: 0;
    }
    .toggle.on { background: var(--accent); outline-color: var(--bright-accent); }
    .toggle-thumb {
        position: absolute; top: 50%; left: 0.2rem; transform: translateY(-50%);
        width: 1.15rem; height: 1.15rem; border-radius: 50%; background: white;
        transition: left 200ms cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 1px 4px hsl(0,0%,0%,0.3);
    }
    .toggle.on .toggle-thumb { left: calc(100% - 1.35rem); }
</style>
