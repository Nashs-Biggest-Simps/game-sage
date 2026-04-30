<script>
    import { db }                  from '$lib/data'
    import { goto }                from '$app/navigation'
    import { resolve }             from '$app/paths'
    // Hero
    import ContinuePlayingHero     from '$lib/components/dashboard-panels/ContinuePlayingHero.svelte'
    // Row sections — ordered by user value / recency / discovery
    import RecentlyPlayed          from '$lib/components/dashboard-rows/RecentlyPlayed.svelte'
    import AISuggestions           from '$lib/components/dashboard-rows/AISuggestions.svelte'
    import LibrarySuggestions      from '$lib/components/dashboard-rows/LibrarySuggestions.svelte'
    import ThisWeekRow             from '$lib/components/dashboard-rows/ThisWeekRow.svelte'
    import MostPlayed              from '$lib/components/dashboard-rows/MostPlayed.svelte'
    import FriendGroupFavorites    from '$lib/components/dashboard-rows/FriendGroupFavorites.svelte'
    import FriendNotOwned          from '$lib/components/dashboard-rows/FriendNotOwned.svelte'
    import TrendingForYou          from '$lib/components/dashboard-rows/TrendingForYou.svelte'
    import GameNewsPanel           from '$lib/components/game-cards/GameNewsPanel.svelte'
    // Right panel modules
    import QuickStats              from '$lib/components/dashboard-panels/QuickStats.svelte'
    import FriendInsights          from '$lib/components/dashboard-panels/FriendInsights.svelte'
    import FriendsList             from '$lib/components/dashboard-panels/FriendsList.svelte'
    import GenreSpotlightPanel     from '$lib/components/dashboard-panels/GenreSpotlightPanel.svelte'
    import RecentSessions          from '$lib/components/dashboard-panels/RecentSessions.svelte'
    import PopularWithFriends      from '$lib/components/dashboard-panels/PopularWithFriends.svelte'

    let mostRecentGame = $derived($db?.cache?.recentlyPlayed?.data[0] ?? null)
    let name           = $derived($db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? null)
    let pfp            = $derived($db?.cache?.user?.data?.avatarfull  ?? $db?.user?.photoURL    ?? null)
    const profileHref  = resolve('/profile')

    function openProfile(event) {
        event.preventDefault()
        goto(profileHref)
    }
</script>

<div class="page">
    <div class="page-header">
        <div class="page-title">Dashboard</div>
        <a href={profileHref} class="profile-btn" onclick={openProfile}>
            {#if pfp}
                <img src={pfp} alt="" class="profile-img" />
            {:else}
                <div class="profile-icon"><i class="fa-solid fa-user"></i></div>
            {/if}
            {#if name}
                <span>{name}</span>
            {/if}
        </a>
    </div>

    <div class="dashboard">
        <ContinuePlayingHero />

        <div class="main-grid">
            <div class="left-col">
                <!-- 1. Jump Back In -->
                <RecentlyPlayed />
                <!-- 2. AI Picks (when available) -->
                <AISuggestions />
                <!-- 3. Suggested from Library (genre-weighted algorithm) -->
                <LibrarySuggestions />
                <!-- 4. On Rotation This Week -->
                <ThisWeekRow />
                <!-- 5. All-Time Favorites -->
                <MostPlayed />
                <!-- 6. Trending in Your Circle -->
                <FriendGroupFavorites />
                <!-- 7. Your Friends Play This (not owned) -->
                <FriendNotOwned />
                <!-- 8. New & Trending For You -->
                <TrendingForYou />
                <!-- News for most recently played game -->
                <GameNewsPanel game={mostRecentGame ?? null} />
            </div>

            <aside class="right-col">
                <QuickStats />
                <FriendInsights />
                <FriendsList />
                <GenreSpotlightPanel />
                <RecentSessions />
                <PopularWithFriends />
            </aside>
        </div>
    </div>
</div>

<style>
    .page {
        display: grid;
        gap: 1.2rem;
    }

    .dashboard {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .main-grid {
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 20rem;
        gap: 2.4rem;
        align-items: start;
    }

    .left-col {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .right-col {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    .profile-btn {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.35rem 0.7rem 0.35rem 0.35rem;
        margin-left: 0.5rem;
        border-radius: 100vh;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: background 150ms;
        outline: solid 1pt transparent;
    }

    .profile-btn:hover {
        background: var(--l1);
        outline-color: var(--l3);
    }

    .profile-img {
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 50%;
        object-fit: cover;
    }

    .profile-icon {
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 50%;
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
    }
</style>
