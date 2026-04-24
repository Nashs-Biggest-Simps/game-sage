<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'
    import { auth } from '$lib/auth'
    import { db, hasAppSession, startGuestSession } from '$lib/data'
    import { isFirebaseConfigured } from '$lib/firebase'

    let loading = $state(false)
    let error = $state(null)

    $effect(() => {
        if (hasAppSession($db)) goto(resolve('/dashboard'))
    })

    function continueAsGuest() {
        startGuestSession()
        goto(resolve('/dashboard'))
    }

    async function signInWithGoogle() {
        if (!auth || !isFirebaseConfigured) return

        loading = true
        error = null

        try {
            await signInWithPopup(auth, new GoogleAuthProvider())
        } catch (cause) {
            console.error('[login] signInWithPopup error:', cause)
            if (cause?.code === 'auth/popup-closed-by-user' || cause?.code === 'auth/cancelled-popup-request') {
                error = null
            } else {
                error = cause?.message ?? 'Google sign-in failed. Try guest mode or check Firebase configuration.'
            }
            loading = false
        }
    }
</script>

<div class="login-page">
    <div class="login-card">
        <SurfacePanel highlight>
            <PageHeader
                eyebrow="Start playing faster"
                title="Open GameSage without waiting on auth."
                description="Guest mode is enough to connect a Steam ID, sync your library, and use the full dashboard. Google is optional if you want a persistent account layer later."
            />

            <div class="choice-grid">
                <button class="choice primary" onclick={continueAsGuest}>
                    <div class="choice-icon"><i class="fa-solid fa-door-open"></i></div>
                    <div class="choice-copy">
                        <strong>Continue as Guest</strong>
                        <p>Recommended for immediate library browsing, suggestions, and local caching.</p>
                    </div>
                </button>

                <button class="choice secondary" onclick={signInWithGoogle} disabled={!isFirebaseConfigured || loading}>
                    <div class="choice-icon"><i class="fa-brands fa-google"></i></div>
                    <div class="choice-copy">
                        <strong>{loading ? 'Signing in…' : 'Continue with Google'}</strong>
                        <p>
                            {#if isFirebaseConfigured}
                                Optional account sign-in if you want Google-linked identity on top of the guest-first app flow.
                            {:else}
                                Firebase environment variables are not configured in this build, so Google sign-in is currently unavailable.
                            {/if}
                        </p>
                    </div>
                </button>
            </div>

            {#if error}
                <div class="error-row">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <span>{error}</span>
                </div>
            {/if}

            <div class="login-notes">
                <div>
                    <strong>Guest mode</strong>
                    <p>Stores app data locally on this device. You still get Steam sync, dashboard widgets, and cached recommendations.</p>
                </div>
                <div>
                    <strong>Google mode</strong>
                    <p>Adds a signed identity layer for profile enrichment, but it is not required to use GameSage.</p>
                </div>
            </div>
        </SurfacePanel>
    </div>
</div>

<style>
    .login-page {
        min-height: calc(100vh - 8rem);
        display: grid;
        place-items: center;
        padding: 2.4rem var(--inline-moat);
    }

    .login-card {
        width: min(100%, 58rem);
        display: grid;
        gap: 1.4rem;
    }

    .choice-grid,
    .login-notes {
        display: grid;
        gap: 1rem;
    }

    .choice-grid {
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    }

    .choice {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        align-items: start;
        padding: 1.1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
        text-align: left;
        transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
    }

    .choice:hover:not(:disabled) {
        transform: translateY(-2px);
        border-color: var(--panel-border-strong);
        background: hsl(214, 32%, 18%, 0.86);
    }

    .choice:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .choice.primary {
        background: linear-gradient(180deg, hsl(213, 82%, 56%, 0.16), hsl(213, 30%, 18%, 0.6));
        border-color: var(--panel-border-strong);
    }

    .choice-icon {
        width: 2.8rem;
        height: 2.8rem;
        display: grid;
        place-items: center;
        border-radius: 0.95rem;
        background: var(--panel-strong);
        color: var(--accent-strong);
        border: 1px solid var(--panel-border-strong);
    }

    .choice-copy {
        display: grid;
        gap: 0.45rem;
    }

    .choice-copy strong,
    .login-notes strong {
        font-size: 1rem;
        line-height: 1.35;
    }

    .choice-copy p,
    .login-notes p,
    .error-row {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.6;
        font-size: 0.84rem;
    }

    .error-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.9rem 1rem;
        border-radius: var(--radius-sm);
        background: hsl(0, 62%, 18%, 0.64);
        border: 1px solid hsl(0, 62%, 36%, 0.68);
        color: hsl(0, 88%, 84%);
    }

    .login-notes {
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        padding-top: 0.2rem;
    }
</style>
