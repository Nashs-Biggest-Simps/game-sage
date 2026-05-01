<script>
    import { clearCache, db } from '$lib/data'
    import { refreshFriends, startCacheUpdateCycle } from '$lib/cache'
    import { isValidSteamId } from '$lib/steam'
    import SteamProfileData from '$lib/components/profile/SteamProfileData.svelte'
    import SteamAccountPanel from '$lib/components/profile/SteamAccountPanel.svelte'
    import LibraryStatsPanel from '$lib/components/profile/LibraryStatsPanel.svelte'
    import GoogleAccountPanel from '$lib/components/profile/GoogleAccountPanel.svelte'

    const ID_REGEX = /^\d{17}$/
    const PERSONA_STATES = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play']

    let inputID = $state('')
    let saveStatus = $state(null)
    let didAutoRecheck = $state(false)
    let refreshingFriends = $state(false)

    let fireUser = $derived($db?.user)
    let steamUser = $derived($db?.cache?.user?.data ?? null)
    let savedID = $derived($db?.steamID ?? '')
    let steamStatus = $derived($db?.cache?.status?.steam ?? null)
    let libraryStatus = $derived($db?.cache?.status?.library ?? null)
    let friendsStatus = $derived($db?.cache?.status?.friends ?? null)
    let profileFriendsStatus = $derived(
        refreshingFriends && friendsStatus?.state === 'private'
            ? { ...friendsStatus, state: 'checking' }
            : friendsStatus
    )

    let googleAvatar = $derived(fireUser?.photoURL ?? null)
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
        return {
            name: details[id]?.data?.name ?? `App ${id}`,
            hours: Math.round(minutes / 60),
        }
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

    let connection = $derived(() => {
        if (!savedID) return {
            type: 'warn',
            icon: 'circle-info',
            title: 'Needs Steam ID',
            message: 'Add your 17-digit SteamID64 to load your library, friend insights, and recommendations.',
        }
        if (!isValidSteamId(savedID)) return {
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
</script>

<div class="account-layout">
    <div class="account-col">
        <SteamProfileData
            {steamUser}
            {savedID}
            connection={connection()}
            steamVisibility={steamVisibility()}
            lastLogoff={lastLogoff()}
            friendsStatus={profileFriendsStatus}
            onRefresh={refreshLibrary}
        />
        <SteamAccountPanel
            {steamUser}
            {savedID}
            bind:inputID
            {saveStatus}
            {isDirty}
            {isValid}
            {willWipe}
            {personaState}
            accountCreated={accountCreated()}
            accountAge={accountAge()}
            steamVisibility={steamVisibility()}
            {profileState}
            lastLogoff={lastLogoff()}
            onSave={saveChanges}
            onReset={resetChanges}
        />
    </div>

    <div class="account-col">
        <LibraryStatsPanel
            {librarySize}
            playedCount={playedCount()}
            {totalHours}
            mostPlayedGame={mostPlayedGame()}
        />
        <GoogleAccountPanel
            {fireUser}
            {googleAvatar}
            {email}
            {googleProvider}
            {emailVerified}
            {googleCreated}
            {googleLastSign}
        />
    </div>
</div>

<style>
    .account-col {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
    }

    .account-layout {
        display: grid;
        grid-template-columns: minmax(18rem, 0.95fr) minmax(20rem, 1.05fr);
        gap: 1.2rem;
        align-items: start;
    }

    @media (max-width: 980px) {
        .account-layout {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
