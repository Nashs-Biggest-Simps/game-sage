<script>
    import SteamProfileData from '$lib/components/profile/SteamProfileData.svelte'
    import SteamAccountPanel from '$lib/components/profile/SteamAccountPanel.svelte'
    import LibraryStatsPanel from '$lib/components/profile/LibraryStatsPanel.svelte'
    import GoogleAccountPanel from '$lib/components/profile/GoogleAccountPanel.svelte'

    let {
        steamUser,
        savedID,
        connection,
        steamVisibility,
        lastLogoff,
        friendsStatus,
        inputID = $bindable(''),
        saveStatus,
        isDirty,
        isValid,
        willWipe,
        personaState,
        accountCreated,
        accountAge,
        profileState,
        librarySize,
        playedCount,
        totalHours,
        mostPlayedGame,
        fireUser,
        googleAvatar,
        email,
        googleProvider,
        emailVerified,
        googleCreated,
        googleLastSign,
        onRefresh,
        onSave,
        onReset,
    } = $props()
</script>

<div class="account-layout">
    <div class="account-col">
        <SteamProfileData
            {steamUser}
            {savedID}
            {connection}
            {steamVisibility}
            {lastLogoff}
            {friendsStatus}
            onRefresh={onRefresh}
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
            {accountCreated}
            {accountAge}
            {steamVisibility}
            {profileState}
            {lastLogoff}
            onSave={onSave}
            onReset={onReset}
        />
    </div>

    <div class="account-col">
        <LibraryStatsPanel
            {librarySize}
            {playedCount}
            {totalHours}
            {mostPlayedGame}
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
