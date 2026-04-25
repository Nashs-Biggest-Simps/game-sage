<script>
    import { onMount }          from 'svelte'
    import { db }               from '$lib/data'
    import { steamAPI }         from '$lib/steam'
    import { goto }             from '$app/navigation'
    import { resolve }          from '$app/paths'
    // Top Hero Section
    import ContinuePlayingHero  from '$lib/components/Dashboard/ContinuePlayingHero.svelte'
    // Row Sections
    import RecentlyPlayed       from '$lib/components/row-sections/RecentlyPlayed.svelte';
    import LibrarySuggestions   from '$lib/components/row-sections/LibrarySuggestions.svelte'
    import MostPlayed           from '$lib/components/row-sections/MostPlayed.svelte'
    import FriendsPlaying       from '$lib/components/row-sections/FriendsPlaying.svelte';
    // Bottom News Section
    import NewsDisplay          from '$lib/components/games/NewsDisplay.svelte';
    // Right Side Modules
    import QuickStats           from '$lib/components/mod/QuickStats.svelte'
    import ActivityFeed         from '$lib/components/mod/ActivityFeed.svelte'

    let mostRecentGame = $derived($db?.cache?.recentlyPlayed?.data[0] ?? null)
    let libraryCount   = $derived(($db?.cache?.library?.appIdList ?? []).length)
    let name           = $state(null)
	let pfp            = $state(null)

	$effect(() => {
		name = $db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? null
		pfp = $db?.cache?.user?.data?.avatarfull ?? $db?.user?.photoURL ?? null
	})
</script>

<div class="page">
    <div class="page-header">
        <div class="page-title">Dashboard</div>
        <a href={resolve("/profile")} class="profile-btn">
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
                <!-- Recently Played Scroll -->
                <RecentlyPlayed />
                <LibrarySuggestions />
                <MostPlayed />
                <FriendsPlaying />
                <NewsDisplay game={mostRecentGame ?? null} />

            </div>
    
            <aside class="right-col">
                <QuickStats />
                <ActivityFeed />
            </aside>
        </div>
    
    </div>
</div>

<style>
    .page{
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
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
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
        position: sticky;
        top: 2.4rem;
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

	.profile-btn.active {
		background: var(--la1);
		outline-color: var(--la3);
		color: var(--bright-accent);
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
