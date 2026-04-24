<script>
    import '$lib/main.css'
    import '$lib/main.rue'
    import { onMount } from 'svelte'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { page } from '$app/state'
    import AppNav from '$lib/components/layout/AppNav.svelte'
    import { authReady } from '$lib/auth'
    import { db, hasAppSession } from '$lib/data'
    import { startCacheUpdateCycle } from '$lib/cache'

    let { children } = $props()

    const PUBLIC_ROUTES = ['/', '/login']

    let pathname = $derived(page.url.pathname)
    let hasSession = $derived(hasAppSession($db))
    let hasSteamID = $derived(!!$db?.steamID)
    let showSteamBanner = $derived(hasSession && !hasSteamID && !PUBLIC_ROUTES.includes(pathname) && pathname !== '/profile')

    $effect(() => {
        if ($authReady && !hasSession && !PUBLIC_ROUTES.includes(pathname)) {
            goto(resolve('/login'))
        }
    })

    onMount(startCacheUpdateCycle)
</script>

<svelte:head>
    <title>GameSage</title>
    <link rel="icon" href="/logo.png" />
    <script src="https://kit.fontawesome.com/5cf062dc93.js" crossorigin="anonymous"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="app-shell">
    <div class="background-layer"></div>

    {#if hasSession}
        <div class="nav-shell">
            <AppNav />
        </div>
    {/if}

    {#if showSteamBanner}
        <div class="steam-banner">
            <i class="fa-solid fa-link"></i>
            <span>
                Add your Steam ID in <a href={resolve('/profile')}>Profile</a> to unlock library sync, suggestions, and friend activity.
            </span>
        </div>
    {/if}

    <main class="content" class:public={!hasSession}>
        {@render children()}
    </main>
</div>

<style>
    .app-shell {
        min-height: 100vh;
    }

    .background-layer {
        position: fixed;
        inset: 0;
        z-index: -1;
        background:
            radial-gradient(circle at 12% 10%, hsl(212, 88%, 30%, 0.26), transparent 26%),
            radial-gradient(circle at 88% 0%, hsl(219, 60%, 18%, 0.32), transparent 26%),
            linear-gradient(180deg, transparent, hsl(216, 32%, 8%, 0.45));
        pointer-events: none;
    }

    .nav-shell {
        padding-inline: var(--inline-moat);
        border-bottom: 1px solid hsl(214, 24%, 22%, 0.65);
        backdrop-filter: blur(18px);
        background: hsl(216, 34%, 7%, 0.58);
        position: sticky;
        top: 0;
        z-index: 20;
    }

    .steam-banner {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.82rem var(--inline-moat);
        background: hsl(36, 58%, 13%, 0.82);
        border-bottom: 1px solid hsl(36, 58%, 28%, 0.7);
        color: hsl(40, 92%, 76%);
        font-size: 0.82rem;
    }

    .steam-banner a {
        text-decoration: underline;
    }

    .content {
        padding: 2rem var(--inline-moat) 3rem;
    }

    .content.public {
        padding: 0;
    }
</style>
