<script>
    import { resolve } from '$app/paths'
    import { page } from '$app/state'
    import { db } from '$lib/data'
    import AppNavItem from '$lib/components/layout/AppNavItem.svelte'

    const ITEMS = [
        { href: '/dashboard', icon: 'chart-line', label: 'Dashboard' },
        { href: '/library', icon: 'grip', label: 'Library' },
        { href: '/suggest', icon: 'wand-magic-sparkles', label: 'Suggested' },
        { href: '/activity', icon: 'users', label: 'Activity' },
        { href: '/search', icon: 'magnifying-glass', label: 'Search' },
    ]

    let profileName = $derived($db?.cache?.user?.data?.personaname ?? $db?.user?.displayName ?? 'Guest')
    let profileImage = $derived($db?.cache?.user?.data?.avatarfull ?? $db?.user?.photoURL ?? null)
    let profileMeta = $derived($db?.session?.mode === 'google' ? 'Google session' : 'Guest session')
    let isProfile = $derived(page.url.pathname === '/profile')
</script>

<nav class="app-nav">
    <a class="brand" href={resolve('/')}>
        <span class="brand-mark"><i class="fa-solid fa-hat-wizard"></i></span>
        <span class="brand-copy">
            <strong>GameSage</strong>
            <small>Steam, clarified</small>
        </span>
    </a>

    <div class="links">
        {#each ITEMS as item}
            <AppNavItem {...item} />
        {/each}
    </div>

    <a class="profile-link" class:active={isProfile} href={resolve('/profile')}>
        {#if profileImage}
            <img src={profileImage} alt="" />
        {:else}
            <span class="profile-fallback"><i class="fa-solid fa-user"></i></span>
        {/if}
        <span class="profile-copy">
            <strong>{profileName}</strong>
            <small>{profileMeta}</small>
        </span>
    </a>
</nav>

<style>
    .app-nav {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 0;
    }

    .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.8rem;
        min-width: 0;
    }

    .brand-mark {
        width: 2.6rem;
        height: 2.6rem;
        display: grid;
        place-items: center;
        border-radius: 0.95rem;
        background: linear-gradient(180deg, hsl(211, 80%, 60%), hsl(216, 78%, 46%));
        color: white;
        box-shadow: 0 18px 36px hsl(213, 72%, 26%, 0.48);
        flex-shrink: 0;
    }

    .brand-copy {
        display: grid;
        gap: 0.14rem;
    }

    .brand-copy strong {
        font-size: 0.98rem;
        letter-spacing: -0.03em;
    }

    .brand-copy small,
    .profile-copy small {
        color: var(--text-dim);
        font-size: 0.72rem;
    }

    .links {
        display: flex;
        justify-content: center;
        gap: 0.35rem;
        flex-wrap: wrap;
    }

    .profile-link {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.4rem 0.5rem 0.4rem 0.4rem;
        border-radius: 999px;
        border: 1px solid transparent;
        transition: background 160ms, border-color 160ms;
    }

    .profile-link:hover,
    .profile-link.active {
        background: var(--panel-soft);
        border-color: var(--panel-border);
    }

    .profile-link img,
    .profile-fallback {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        object-fit: cover;
        display: grid;
        place-items: center;
        background: var(--panel-strong);
        flex-shrink: 0;
    }

    .profile-copy {
        display: grid;
        gap: 0.1rem;
    }

    .profile-copy strong {
        font-size: 0.85rem;
    }

    @media (max-width: 980px) {
        .app-nav {
            grid-template-columns: 1fr;
        }

        .links {
            justify-content: flex-start;
        }

        .profile-link {
            justify-self: flex-start;
        }
    }
</style>
