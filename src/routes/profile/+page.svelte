<script>
    import { db, clearCache, hardResetDB } from '$lib/data'
    import { auth } from '$lib/auth'
    import { refreshFriends, startCacheUpdateCycle } from '$lib/cache'
    import { signOut } from 'firebase/auth'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { isValidSteamId } from '$lib/steam'
    import FriendsPanel from '$lib/components/profile/FriendsPanel.svelte'
    import DataCacheSection from '$lib/components/profile/DataCacheSection.svelte'
    import PreferencesSection from '$lib/components/profile/PreferencesSection.svelte'
    import ContentLayoutSection from '$lib/components/profile/ContentLayoutSection.svelte'
    import ProfileSidebar from '$lib/components/profile/ProfileSidebar.svelte'
    import ProfileAccountTab from '$lib/components/profile/ProfileAccountTab.svelte'

    const ID_REGEX = /^\d{17}$/
    const PERSONA_STATES = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play']

    const NAV = [
        { id: 'account', label: 'Your Account', icon: 'user' },
        { id: 'friends', label: 'Friends List', icon: 'user-group' },
        { id: 'data', label: 'Data & Cache', icon: 'database' },
        { id: 'layout', label: 'Content Layout', icon: 'table-columns' },
        { id: 'preferences', label: 'Preferences', icon: 'sliders' },
    ]

    let inputID = $state('')
    let saveStatus = $state(null)
    let activeNav = $state('account')
    let dbExpanded = $state(false)
    let confirmHardReset = $state(false)
    let didAutoRecheck = $state(false)
    let refreshingFriends = $state(false)

    let fireUser = $derived($db?.user)
    let steamUser = $derived($db?.cache?.user?.data ?? null)
    let savedID = $derived($db?.steamID ?? '')
    let hasValidSteamID = $derived(isValidSteamId(savedID))
    let needsSteamSetup = $derived(!hasValidSteamID)
    let steamStatus = $derived($db?.cache?.status?.steam ?? null)
    let libraryStatus = $derived($db?.cache?.status?.library ?? null)
    let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
    let profileFriendsStatus = $derived(
        refreshingFriends && friendsStatus?.state === 'private'
            ? { ...friendsStatus, state: 'checking' }
            : friendsStatus
    )

    let avatar = $derived(steamUser?.avatarfull ?? fireUser?.photoURL ?? null)
    let googleAvatar = $derived(fireUser?.photoURL ?? null)
    let displayName = $derived(steamUser?.personaname ?? fireUser?.displayName ?? 'User')
    let email = $derived(fireUser?.email ?? '')

    let librarySize = $derived($db?.cache?.library?.appIdList?.length ?? 0)
    let totalMinutes = $derived(() => {
        const playtime = $db?.cache?.library?.playtime ?? {}
        return Object.values(playtime).reduce((sum, minutes) => sum + minutes, 0)
    })
    let totalHours = $derived(Math.round(totalMinutes() / 60))
    let playedCount = $derived(() => {
        const playtime = $db?.cache?.library?.playtime ?? {}
        return Object.values(playtime).filter(minutes => minutes > 0).length
    })
    let mostPlayedGame = $derived(() => {
        const playtime = $db?.cache?.library?.playtime ?? {}
        const details = $db?.cache?.library?.details ?? {}
        const top = Object.entries(playtime).sort(([, a], [, b]) => b - a)[0]
        if (!top) return null
        const [id, minutes] = top
        return { name: details[id]?.data?.name ?? `App ${id}`, hours: Math.round(minutes / 60) }
    })

    let steamVisibility = $derived(() => {
        const visibility = steamUser?.communityvisibilitystate
        if (visibility === 3) return 'Public'
        if (visibility === 2) return 'Friends Only'
        if (visibility === 1) return 'Private'
        return '—'
    })

    let personaState = $derived(PERSONA_STATES[steamUser?.personastate ?? 0] ?? '—')
    let profileState = $derived(steamUser?.profilestate === 1 ? 'Configured' : steamUser ? 'Limited' : '—')
    let accountCreated = $derived(() => {
        const created = steamUser?.timecreated
        if (!created) return null
        return new Date(created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    })
    let accountAge = $derived(() => {
        const created = steamUser?.timecreated
        if (!created) return null
        const years = (Date.now() - created * 1000) / (365.25 * 24 * 60 * 60 * 1000)
        if (years < 1) return '<1 year'
        return `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''}`
    })
    let lastLogoff = $derived(() => {
        const logoff = steamUser?.lastlogoff
        if (!logoff) return null
        const secs = Math.floor(Date.now() / 1000) - logoff
        if (secs < 60) return 'just now'
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
        return new Date(logoff * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    })

    let googleCreated = $derived(fireUser?.metadata?.creationTime ?? null)
    let googleLastSign = $derived(fireUser?.metadata?.lastSignInTime ?? null)
    let googleProvider = $derived(fireUser?.providerData?.[0]?.providerId ?? null)
    let emailVerified = $derived(fireUser?.emailVerified ?? false)

    let isDirty = $derived(inputID.trim() !== savedID)
    let isValid = $derived(ID_REGEX.test(inputID.trim()))
    let willWipe = $derived(isDirty && isValid)
    let visibleNav = $derived(needsSteamSetup ? NAV.filter(item => item.id === 'account') : NAV)

    let connectionState = $derived(() => {
        if (!savedID) return {
            type: 'warn',
            icon: 'circle-info',
            title: 'Needs Steam ID',
            message: 'Add your 17-digit SteamID64 to load your library, friend insights, and recommendations.',
        }
        if (!ID_REGEX.test(savedID)) return {
            type: 'danger',
            icon: 'triangle-exclamation',
            title: 'Invalid Steam ID',
            message: 'GameSage will not make Steam API calls until the saved Steam ID is exactly 17 digits.',
        }
        if (steamStatus?.state === 'invalid') return {
            type: 'danger',
            icon: 'circle-xmark',
            title: 'Not found',
            message: steamStatus.message,
        }
        if (libraryStatus?.state === 'private') return {
            type: 'danger',
            icon: 'lock',
            title: 'Private library',
            message: libraryStatus.message,
        }
        if (steamStatus?.state === 'checking' || libraryStatus?.state === 'checking') return {
            type: 'info',
            icon: 'circle-notch fa-spin',
            title: 'Checking',
            message: 'GameSage is validating your profile and library visibility.',
        }
        if (libraryStatus?.state === 'ok' || steamStatus?.state === 'ok') return {
            type: 'ok',
            icon: 'circle-check',
            title: 'Connected',
            message: libraryStatus?.message ?? 'Your Steam profile and visible library data are available.',
        }
        return {
            type: 'info',
            icon: 'circle-info',
            title: 'Pending',
            message: 'Save your Steam ID or refresh your library to check visibility.',
        }
    })

    $effect(() => {
        if (savedID && !inputID) inputID = savedID
    })

    $effect(() => {
        if (needsSteamSetup && activeNav !== 'account') activeNav = 'account'
    })

    $effect(() => {
        if (didAutoRecheck || !fireUser?.uid || !ID_REGEX.test(savedID)) return
        didAutoRecheck = true
        refreshingFriends = true
        startCacheUpdateCycle()
        refreshFriends({ force: true }).finally(() => {
            refreshingFriends = false
        })
    })

    function flashStatus(status, duration = 2500) {
        saveStatus = status
        setTimeout(() => saveStatus = null, duration)
    }

    function saveChanges() {
        const trimmed = inputID.trim()
        if (!ID_REGEX.test(trimmed)) {
            flashStatus('error', 3000)
            return
        }

        const changed = trimmed !== savedID
        db.update(data => {
            if (changed) {
                data.cache = {}
                data.algr = {}
            }
            data.steamID = trimmed
            return data
        })
        if (changed) startCacheUpdateCycle()
        flashStatus('saved')
    }

    function resetChanges() {
        inputID = savedID
        saveStatus = null
    }

    function refreshLibrary() {
        if (!fireUser?.uid || !ID_REGEX.test(savedID)) {
            flashStatus('error', 3000)
            return
        }
        refreshingFriends = true
        clearCache()
        startCacheUpdateCycle()
        refreshFriends({ force: true }).finally(() => {
            refreshingFriends = false
        })
        flashStatus('refreshed')
    }

    function clearSuggestions() {
        db.update(data => {
            if (data.cache?.suggestions) data.cache.suggestions = {}
            if (data.algr) data.algr = {}
            return data
        })
        flashStatus('suggestions-cleared')
    }

    function clearSteamConnection() {
        db.update(data => {
            data.steamID = ''
            data.cache = {}
            data.algr = {}
            return data
        })
        inputID = ''
        flashStatus('steam-cleared')
    }

    async function hardReset() {
        if (!confirmHardReset) {
            confirmHardReset = true
            setTimeout(() => confirmHardReset = false, 5000)
            return
        }
        await signOut(auth).catch(() => {})
        hardResetDB()
        goto(resolve('/'))
    }

    async function logout() {
        await signOut(auth)
        db.update(data => {
            data.user = {}
            return data
        })
        goto(resolve('/'))
    }
</script>

<div class="profile-page">
    <ProfileSidebar
        {avatar}
        {displayName}
        {email}
        {visibleNav}
        bind:activeNav
        onLogout={logout}
    />

    <main class="main-content">
        {#if needsSteamSetup}
            <div class="setup-lock">
                <i class="fa-solid fa-lock"></i>
                <span>Add a valid 17-digit SteamID64 to unlock the dashboard, activity, library, search, friends, cache tools, and preferences.</span>
            </div>
        {/if}

        {#if activeNav === 'account'}
            <ProfileAccountTab
                {steamUser}
                {savedID}
                connection={connectionState()}
                steamVisibility={steamVisibility()}
                lastLogoff={lastLogoff()}
                friendsStatus={profileFriendsStatus}
                bind:inputID
                {saveStatus}
                {isDirty}
                {isValid}
                {willWipe}
                {personaState}
                accountCreated={accountCreated()}
                accountAge={accountAge()}
                {profileState}
                {librarySize}
                playedCount={playedCount()}
                {totalHours}
                mostPlayedGame={mostPlayedGame()}
                {fireUser}
                {googleAvatar}
                {email}
                {googleProvider}
                {emailVerified}
                {googleCreated}
                {googleLastSign}
                onRefresh={refreshLibrary}
                onSave={saveChanges}
                onReset={resetChanges}
            />
        {:else if activeNav === 'friends'}
            <FriendsPanel />
        {:else if activeNav === 'data'}
            <DataCacheSection
                {saveStatus}
                {confirmHardReset}
                bind:dbExpanded
                onRefreshLibrary={refreshLibrary}
                onClearSuggestions={clearSuggestions}
                onClearSteamConnection={clearSteamConnection}
                onHardReset={hardReset}
            />
        {:else if activeNav === 'layout'}
            <ContentLayoutSection
                dashboardAllowColumnChanges={false}
                activityAllowColumnChanges={true}
            />
        {:else if activeNav === 'preferences'}
            <PreferencesSection />
        {/if}
    </main>
</div>

<style>
    .profile-page {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr);
        gap: 1.2rem;
        align-items: start;
    }

    .main-content {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
    }

    .setup-lock {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.85rem 1rem;
        border-radius: 0.85rem;
        background: hsl(38, 55%, 12%, 0.72);
        outline: solid 1pt hsl(38, 58%, 28%, 0.72);
        color: hsl(38, 86%, 72%);
        font-size: 0.84rem;
        line-height: 1.45;
    }

    .setup-lock i {
        flex-shrink: 0;
        font-size: 0.78rem;
    }

    @media (max-width: 980px) {
        .profile-page {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
