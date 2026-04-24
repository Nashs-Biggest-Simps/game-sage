<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { signOut } from 'firebase/auth'
    import { auth } from '$lib/auth'
    import {
        applyLibraryDefaults,
        clearCache,
        cycleGenrePreference,
        db,
        endSession,
        setPreference,
        setSteamID,
    } from '$lib/data'
    import { startCacheUpdateCycle } from '$lib/cache'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import SectionHeader from '$lib/components/layout/SectionHeader.svelte'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'
    import StatsGrid from '$lib/components/Dashboard/StatsGrid.svelte'

    const NAV = [
        { id: 'account', label: 'Account', icon: 'user' },
        { id: 'preferences', label: 'Preferences', icon: 'sliders' },
        { id: 'cache', label: 'Cache', icon: 'database' },
    ]

    const GENRES = [
        'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports',
        'Racing', 'Puzzle', 'Horror', 'Indie', 'Casual', 'Multiplayer',
        'Story Rich', 'Open World', 'Shooter', 'Platformer', 'Stealth',
        'Survival', 'Tower Defense', 'Visual Novel',
    ]

    let activeTab = $state('account')
    let status = $state(null)
    let inputID = $state('')

    let session = $derived($db?.session ?? {})
    let fireUser = $derived($db?.user ?? null)
    let steamUser = $derived($db?.cache?.user?.data ?? null)
    let savedID = $derived($db?.steamID ?? '')
    let librarySize = $derived($db?.cache?.library?.appIdList?.length ?? 0)
    let playtime = $derived($db?.cache?.library?.playtime ?? {})
    let totalHours = $derived(Math.round(Object.values(playtime).reduce((sum, minutes) => sum + (minutes ?? 0), 0) / 60))
    let playedCount = $derived(Object.values(playtime).filter((minutes) => (minutes ?? 0) > 0).length)
    let modeLabel = $derived(session.mode === 'google' ? 'Google session' : 'Guest session')
    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres = $derived($db?.prefs?.genres?.excluded ?? [])
    let refreshHours = $derived($db?.prefs?.suggestions?.refreshHours ?? 24)
    let aiTone = $derived($db?.prefs?.suggestions?.aiTone ?? 'brief')
    let maxResults = $derived($db?.prefs?.suggestions?.maxResults ?? 8)
    let compactLibrary = $derived($db?.prefs?.display?.compactLibrary ?? false)
    let defaultSort = $derived($db?.prefs?.library?.defaultSort ?? 'None')
    let defaultFilter = $derived($db?.prefs?.library?.defaultFilter ?? 'All')
    let shareActivity = $derived($db?.prefs?.privacy?.shareActivity ?? true)
    let dashboardPrefs = $derived($db?.prefs?.dashboard ?? {})

    const ID_REGEX = /^\d{17}$/

    $effect(() => {
        if (savedID && !inputID) inputID = savedID
    })

    let stats = $derived([
        { label: 'Games owned', value: `${librarySize}`, detail: 'Loaded from your cached Steam library', highlight: true },
        { label: 'Games played', value: `${playedCount}`, detail: `${Math.max(0, librarySize - playedCount)} untouched` },
        { label: 'Total hours', value: `${totalHours}`, detail: 'Rounded across your synced library' },
    ])

    function genreState(genre) {
        if (preferredGenres.includes(genre)) return 'preferred'
        if (excludedGenres.includes(genre)) return 'excluded'
        return 'neutral'
    }

    function saveProfile() {
        if (!ID_REGEX.test(inputID.trim())) {
            status = 'invalid-steam-id'
            return
        }

        setSteamID(inputID)
        startCacheUpdateCycle()
        status = 'saved'
    }

    function saveLibraryPreference(path, value) {
        setPreference(path, value)
        applyLibraryDefaults()
        status = 'prefs-saved'
    }

    async function leaveSession() {
        if (session.mode === 'google' && auth) {
            await signOut(auth)
        }

        endSession()
        goto(resolve('/login'))
    }

    function refreshSteamCache() {
        clearCache()
        startCacheUpdateCycle()
        status = 'cache-cleared'
    }
</script>

<div class="profile-page">
    <aside class="sidebar">
        <SurfacePanel>
            <div class="identity-card">
                {#if steamUser?.avatarfull || fireUser?.photoURL}
                    <img src={steamUser?.avatarfull ?? fireUser?.photoURL} alt="" class="avatar" />
                {:else}
                    <div class="avatar fallback"><i class="fa-solid fa-user"></i></div>
                {/if}
                <div class="identity-copy">
                    <strong>{steamUser?.personaname ?? fireUser?.displayName ?? 'GameSage User'}</strong>
                    <span>{modeLabel}</span>
                </div>
            </div>
            <div class="nav-list">
                {#each NAV as item}
                    <button class="nav-item" class:active={activeTab === item.id} onclick={() => activeTab = item.id}>
                        <i class={`fa-solid fa-${item.icon}`}></i>
                        {item.label}
                    </button>
                {/each}
            </div>
            <button class="btn-ghost" onclick={leaveSession}>
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                {session.mode === 'google' ? 'Sign out' : 'Exit guest session'}
            </button>
        </SurfacePanel>
    </aside>

    <div class="content">
        <PageHeader
            eyebrow="Profile and preferences"
            title="Tune the app without fighting brittle settings."
            description="Profile now treats guest and Google identity as separate concerns, keeps Steam ID front and center, and writes preferences through one consistent path so the UI updates immediately."
        />

        {#if activeTab === 'account'}
            <SurfacePanel>
                <SectionHeader title="Session summary" subtitle="Guest mode is first-class, and Google is optional enrichment." />
                <StatsGrid items={stats} />
            </SurfacePanel>

            <SurfacePanel>
                <SectionHeader title="Steam connection" subtitle="Steam ID is the one setting that unlocks the core product." />
                <div class="field-grid">
                    <label class="field">
                        <span>Steam ID</span>
                        <input bind:value={inputID} maxlength="17" placeholder="76561198000000000" />
                    </label>
                    <div class="field readonly">
                        <span>Current Steam persona</span>
                        <strong>{steamUser?.personaname ?? 'Waiting for Steam sync'}</strong>
                    </div>
                    <div class="field readonly">
                        <span>Profile mode</span>
                        <strong>{modeLabel}</strong>
                    </div>
                    <div class="field readonly">
                        <span>Steam profile</span>
                        {#if steamUser?.profileurl}
                            <a href={steamUser.profileurl} target="_blank" rel="noopener noreferrer">Open on Steam</a>
                        {:else}
                            <strong>Unavailable until sync completes</strong>
                        {/if}
                    </div>
                </div>
                {#if status === 'invalid-steam-id'}
                    <div class="warning">Steam ID must be exactly 17 digits.</div>
                {/if}
                <div class="action-row">
                    <button class="btn-primary" onclick={saveProfile}>
                        <i class="fa-solid fa-floppy-disk"></i>
                        Save Steam ID
                    </button>
                    <button class="btn-ghost" onclick={refreshSteamCache}>
                        <i class="fa-solid fa-rotate"></i>
                        Refresh library cache
                    </button>
                </div>
            </SurfacePanel>

            <SurfacePanel>
                <SectionHeader title="Identity layer" subtitle="Google is optional and only adds account identity, not core product access." />
                {#if session.mode === 'google' && fireUser}
                    <div class="field-grid">
                        <div class="field readonly">
                            <span>Google email</span>
                            <strong>{fireUser.email ?? 'Unknown'}</strong>
                        </div>
                        <div class="field readonly">
                            <span>Email verified</span>
                            <strong>{fireUser.emailVerified ? 'Verified' : 'Not verified'}</strong>
                        </div>
                        <div class="field readonly">
                            <span>Created</span>
                            <strong>{fireUser.metadata?.creationTime ?? 'Unknown'}</strong>
                        </div>
                        <div class="field readonly">
                            <span>Last sign-in</span>
                            <strong>{fireUser.metadata?.lastSignInTime ?? 'Unknown'}</strong>
                        </div>
                    </div>
                {:else}
                    <EmptyState icon="door-open" title="You are using GameSage as a guest." description="That is enough for Steam sync, dashboard data, and recommendations. Google only adds a secondary identity layer." compact />
                {/if}
            </SurfacePanel>
        {/if}

        {#if activeTab === 'preferences'}
            <SurfacePanel>
                <SectionHeader title="Genre tuning" subtitle="Click once to prefer, again to exclude, and again to clear." />
                <div class="genre-grid">
                    {#each GENRES as genre}
                        <button class={`genre-chip ${genreState(genre)}`} onclick={() => cycleGenrePreference(genre)}>
                            {genre}
                        </button>
                    {/each}
                </div>
            </SurfacePanel>

            <SurfacePanel>
                <SectionHeader title="Suggestion behavior" subtitle="The ranking is deterministic first; these preferences control cadence and presentation." />
                <div class="pref-grid">
                    <div class="pref-card">
                        <span>Refresh cadence</span>
                        <div class="segmented">
                            {#each [6, 12, 24, 48] as hours}
                                <button class:active={refreshHours === hours} onclick={() => setPreference('suggestions.refreshHours', hours)}>{hours}h</button>
                            {/each}
                        </div>
                    </div>
                    <div class="pref-card">
                        <span>Explanation tone</span>
                        <div class="segmented">
                            {#each [['brief', 'Brief'], ['detailed', 'Detailed'], ['enthusiastic', 'Energetic']] as [value, label]}
                                <button class:active={aiTone === value} onclick={() => setPreference('suggestions.aiTone', value)}>{label}</button>
                            {/each}
                        </div>
                    </div>
                    <div class="pref-card">
                        <span>Results per section</span>
                        <div class="segmented">
                            {#each [6, 8, 10] as count}
                                <button class:active={maxResults === count} onclick={() => setPreference('suggestions.maxResults', count)}>{count}</button>
                            {/each}
                        </div>
                    </div>
                </div>
            </SurfacePanel>

            <SurfacePanel>
                <SectionHeader title="Dashboard layout" subtitle="These toggles now map directly to the live dashboard sections." />
                <div class="toggle-list">
                    {#each [
                        ['dashboard.showContinuePlaying', dashboardPrefs.showContinuePlaying ?? true, 'Continue playing hero'],
                        ['dashboard.showRecentlyPlayed', dashboardPrefs.showRecentlyPlayed ?? true, 'Recently played section'],
                        ['dashboard.showSuggestions', dashboardPrefs.showSuggestions ?? true, 'Recommendation sections'],
                        ['dashboard.showNews', dashboardPrefs.showNews ?? true, 'Steam news section'],
                        ['dashboard.showStats', dashboardPrefs.showStats ?? true, 'Library pulse and sidebar stats'],
                        ['dashboard.showActivity', dashboardPrefs.showActivity ?? true, 'Friend activity sidebar'],
                    ] as [path, value, label]}
                        <div class="toggle-row">
                            <span>{label}</span>
                            <button class="toggle" class:on={value} onclick={() => setPreference(path, !value)} aria-label={label}>
                                <span></span>
                            </button>
                        </div>
                    {/each}
                </div>
            </SurfacePanel>

            <SurfacePanel>
                <SectionHeader title="Library defaults" subtitle="These apply the next time you open Library." />
                <div class="pref-grid">
                    <div class="pref-card">
                        <span>Default sort</span>
                        <div class="segmented">
                            {#each ['None', 'Most Played', 'A → Z'] as option}
                                <button class:active={defaultSort === option} onclick={() => saveLibraryPreference('library.defaultSort', option)}>{option}</button>
                            {/each}
                        </div>
                    </div>
                    <div class="pref-card">
                        <span>Default display</span>
                        <div class="segmented">
                            {#each ['All', 'Never Played'] as option}
                                <button class:active={defaultFilter === option} onclick={() => saveLibraryPreference('library.defaultFilter', option)}>{option}</button>
                            {/each}
                        </div>
                    </div>
                    <div class="toggle-row">
                        <span>Compact library cards</span>
                        <button class="toggle" class:on={compactLibrary} onclick={() => setPreference('display.compactLibrary', !compactLibrary)} aria-label="Compact library cards">
                            <span></span>
                        </button>
                    </div>
                    <div class="toggle-row">
                        <span>Share activity with friends</span>
                        <button class="toggle" class:on={shareActivity} onclick={() => setPreference('privacy.shareActivity', !shareActivity)} aria-label="Share activity with friends">
                            <span></span>
                        </button>
                    </div>
                </div>
            </SurfacePanel>
        {/if}

        {#if activeTab === 'cache'}
            <SurfacePanel>
                <SectionHeader title="Cache and local data" subtitle="Guest-first mode means the local cache matters, so the controls are explicit." />
                <div class="cache-actions">
                    <button class="btn-primary" onclick={refreshSteamCache}>
                        <i class="fa-solid fa-rotate"></i>
                        Rebuild Steam cache
                    </button>
                    <button class="btn-ghost" onclick={clearCache}>
                        <i class="fa-solid fa-trash"></i>
                        Clear cached suggestions and library data
                    </button>
                </div>
                {#if status === 'saved'}
                    <div class="chip">Steam ID saved and cache refresh started.</div>
                {:else if status === 'cache-cleared'}
                    <div class="chip">Cache cleared and refresh started.</div>
                {:else if status === 'prefs-saved'}
                    <div class="chip">Library defaults updated.</div>
                {/if}
            </SurfacePanel>
        {/if}
    </div>
</div>

<style>
    .profile-page {
        display: grid;
        grid-template-columns: minmax(16rem, 18rem) minmax(0, 1fr);
        gap: 1.2rem;
        align-items: start;
    }

    .sidebar,
    .content,
    .identity-card,
    .identity-copy,
    .nav-list,
    .field-grid,
    .genre-grid,
    .pref-grid,
    .pref-card {
        display: grid;
    }

    .content {
        gap: 1.2rem;
    }

    .sidebar {
        position: sticky;
        top: 5.8rem;
    }

    .identity-card {
        gap: 0.9rem;
        margin-bottom: 1rem;
    }

    .avatar {
        width: 4rem;
        height: 4rem;
        border-radius: 1.1rem;
        object-fit: cover;
    }

    .avatar.fallback {
        display: grid;
        place-items: center;
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
        color: var(--accent-strong);
    }

    .identity-copy {
        gap: 0.25rem;
    }

    .identity-copy span {
        color: var(--text-muted);
        font-size: 0.82rem;
    }

    .nav-list {
        gap: 0.45rem;
        margin-bottom: 1rem;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.78rem 0.9rem;
        border-radius: var(--radius-md);
        color: var(--text-muted);
        border: 1px solid transparent;
    }

    .nav-item.active {
        background: var(--panel-soft);
        border-color: var(--panel-border-strong);
        color: var(--text-primary);
    }

    .field-grid {
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 0.95rem;
    }

    .field {
        display: grid;
        gap: 0.45rem;
        padding: 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .field span {
        color: var(--text-dim);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
    }

    .field input,
    .field strong,
    .field a {
        font-size: 0.96rem;
        color: var(--text-primary);
    }

    .readonly {
        align-content: start;
    }

    .action-row,
    .cache-actions {
        display: flex;
        gap: 0.8rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .genre-grid {
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        gap: 0.75rem;
    }

    .genre-chip {
        padding: 0.78rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        background: var(--panel-soft);
        color: var(--text-muted);
        font-weight: 600;
    }

    .genre-chip.preferred {
        background: hsl(213, 82%, 56%, 0.16);
        border-color: var(--panel-border-strong);
        color: var(--text-primary);
    }

    .genre-chip.excluded {
        background: hsl(0, 72%, 58%, 0.16);
        border-color: hsl(0, 72%, 58%, 0.48);
        color: hsl(0, 88%, 84%);
    }

    .pref-grid {
        gap: 1rem;
    }

    .pref-card {
        gap: 0.6rem;
    }

    .pref-card span,
    .toggle-row span {
        font-size: 0.84rem;
        color: var(--text-muted);
        font-weight: 600;
    }

    .segmented {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
    }

    .segmented button {
        padding: 0.62rem 0.85rem;
        border-radius: 999px;
        border: 1px solid var(--panel-border);
        background: var(--panel-soft);
        color: var(--text-muted);
    }

    .segmented button.active {
        background: var(--accent-soft);
        border-color: var(--panel-border-strong);
        color: var(--text-primary);
    }

    .toggle-list {
        display: grid;
        gap: 0.8rem;
    }

    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.92rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .toggle {
        width: 3.2rem;
        padding: 0.2rem;
        border-radius: 999px;
        background: hsl(214, 18%, 24%);
        display: flex;
        justify-content: flex-start;
    }

    .toggle.on {
        background: hsl(213, 82%, 56%);
        justify-content: flex-end;
    }

    .toggle span {
        width: 1.2rem;
        height: 1.2rem;
        border-radius: 999px;
        background: white;
    }

    @media (max-width: 980px) {
        .profile-page {
            grid-template-columns: 1fr;
        }

        .sidebar {
            position: static;
        }
    }
</style>
