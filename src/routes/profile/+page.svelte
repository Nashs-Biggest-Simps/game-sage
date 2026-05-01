<script>
    //
    // Profile Page
    // created by Aaron Meche
    //
    import { db } from '$lib/data'
    import { auth } from '$lib/auth'
    import { signOut } from 'firebase/auth'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { isValidSteamId } from '$lib/steam'
    // Profile Left Navigator
    import ProfileSidebar from '$lib/components/profile/ProfileSidebar.svelte'
    // 1. Your Account
    import YourAccountPage from '$lib/components/profile/YourAccountPage.svelte'
    // 2. Friends List
    import FriendsPage from '$lib/components/profile/FriendsPage.svelte'
    // 3. Data & Cache
    import DataCachePage from '$lib/components/profile/DataCachePage.svelte'
    // 4. Content Layout
    import ContentLayoutPage from '$lib/components/profile/ContentLayoutPage.svelte'
    // 5. Preferences
    import PreferencesPage from '$lib/components/profile/PreferencesPage.svelte'

    const NAV = [
        { id: 'account', label: 'Your Account', icon: 'user' },
        { id: 'friends', label: 'Friends List', icon: 'user-group' },
        { id: 'data', label: 'Data & Cache', icon: 'database' },
        { id: 'layout', label: 'Content Layout', icon: 'table-columns' },
        { id: 'preferences', label: 'Preferences', icon: 'sliders' },
    ]

    let activeNav = $state('account')

    let fireUser = $derived($db?.user)
    let steamUser = $derived($db?.cache?.user?.data ?? null)
    let savedID = $derived($db?.steamID ?? '')
    let hasValidSteamID = $derived(isValidSteamId(savedID))
    let needsSteamSetup = $derived(!hasValidSteamID)

    let avatar = $derived(steamUser?.avatarfull ?? fireUser?.photoURL ?? null)
    let displayName = $derived(steamUser?.personaname ?? fireUser?.displayName ?? 'User')
    let email = $derived(fireUser?.email ?? '')

    let visibleNav = $derived(needsSteamSetup ? NAV.filter(item => item.id === 'account') : NAV)

    $effect(() => {
        if (needsSteamSetup && activeNav !== 'account') activeNav = 'account'
    })

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
            <YourAccountPage />
        {:else if activeNav === 'friends'}
            <FriendsPage />
        {:else if activeNav === 'data'}
            <DataCachePage />
        {:else if activeNav === 'layout'}
            <ContentLayoutPage />
        {:else if activeNav === 'preferences'}
            <PreferencesPage />
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
