<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { db } from '$lib/data'
    import { auth } from '$lib/auth'
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

    let loading = $state(false)
    let error   = $state(null)
    let targetPath = $derived($db?.steamID ? '/dashboard' : '/profile')

    $effect(() => {
        if ($db?.user?.uid) goto(resolve(targetPath))
    })

    async function signInWithGoogle() {
        loading = true
        error   = null
        try {
            await signInWithPopup(auth, new GoogleAuthProvider())
        } catch (e) {
            console.error('[login] signInWithPopup error:', e)
            if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
                error = null
            } else if (e?.code === 'auth/unauthorized-domain') {
                error = 'This domain is not authorized in Firebase. Add it to the Firebase console under Auth → Settings → Authorized domains.'
            } else {
                error = e?.message ?? 'Sign-in failed. Please try again.'
            }
            loading = false
        }
    }
</script>

<div class="page">
    <div class="card">
        <div class="brand">
            <div class="brand-icon"><i class="fa-solid fa-hat-wizard"></i></div>
            <div class="brand-name">GameSage</div>
            <div class="brand-tagline">Your Steam library, but better.</div>
        </div>

        <div class="divider"></div>

        <div class="body">
            <div class="heading">Sign in to continue</div>
            <div class="sub">Connect with your Google account to get started. No password needed.</div>

            {#if error}
                <div class="error-msg">
                    <i class="fa-solid fa-circle-xmark"></i>
                    {error}
                </div>
            {/if}

            <button class="btn-google" onclick={signInWithGoogle} disabled={loading}>
                {#if loading}
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    Signing in…
                {:else}
                    <i class="fa-brands fa-google"></i>
                    Continue with Google
                {/if}
            </button>

            <p class="fine-print">
                By signing in you agree to link your Steam library for personalized recommendations. Your data is stored locally on this device.
            </p>
        </div>
    </div>
</div>

<style>
    .page {
        min-height: 100dvh;
        margin: -2.4rem calc(var(--inline-moat) * -1);
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem var(--inline-moat);
        overflow: hidden;
        background:
            radial-gradient(circle at 24% 24%, hsl(188, 84%, 48%, 0.18), transparent 28rem),
            radial-gradient(circle at 78% 38%, hsl(146, 68%, 44%, 0.12), transparent 28rem),
            radial-gradient(circle at 52% 74%, hsl(218, 80%, 58%, 0.1), transparent 34rem),
            linear-gradient(145deg, hsl(212, 31%, 7%, 0.1), hsl(212, 30%, 6%, 0.42));
    }

    .card {
        width: 100%;
        max-width: 22rem;
        background: hsl(212, 24%, 12%, 0.44);
        border-radius: 1.4rem;
        outline: solid 1pt hsl(212, 38%, 42%, 0.46);
        box-shadow: 0 24px 70px hsl(0, 0%, 0%, 0.34), inset 0 1px 0 hsl(0, 0%, 100%, 0.06);
        backdrop-filter: blur(30px) saturate(1.32);
        -webkit-backdrop-filter: blur(30px) saturate(1.32);
        overflow: hidden;
    }

    .brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        padding: 2.4rem 2rem 2rem;
        background:
            radial-gradient(circle at 50% 0%, hsl(188, 76%, 54%, 0.14), transparent 10rem),
            linear-gradient(to bottom, hsl(212, 75%, 50%, 0.12), transparent);
    }

    .brand-icon {
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 0.9rem;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        color: white;
        margin-bottom: 0.3rem;
        box-shadow: 0 8px 24px hsl(212, 75%, 50%, 0.35);
    }

    .brand-name {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .brand-tagline {
        font-size: 0.82rem;
        opacity: 0.5;
    }

    .divider {
        height: 1pt;
        background: hsl(212, 38%, 42%, 0.35);
    }

    .body {
        padding: 1.8rem 2rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
    }

    .heading {
        font-size: 1rem;
        font-weight: 700;
    }

    .sub {
        font-size: 0.8rem;
        opacity: 0.5;
        line-height: 1.55;
        margin-top: -0.3rem;
    }

    .error-msg {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.9rem;
        background: hsl(0, 45%, 16%);
        border-radius: 0.6rem;
        outline: solid 1pt hsl(0, 45%, 32%);
        font-size: 0.8rem;
        color: hsl(0, 70%, 68%);
    }

    .btn-google {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        padding: 0.85rem 1.4rem;
        background: white;
        border-radius: 0.7rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: hsl(0, 0%, 15%);
        cursor: pointer;
        transition: background 150ms, transform 100ms, box-shadow 150ms;
        box-shadow: 0 2px 8px hsl(0, 0%, 0%, 0.2);
    }

    .btn-google:hover:not(:disabled) {
        background: hsl(0, 0%, 95%);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px hsl(0, 0%, 0%, 0.25);
    }

    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-google i { font-size: 0.9rem; }

    .fine-print {
        font-size: 0.7rem;
        opacity: 0.3;
        line-height: 1.55;
        text-align: center;
        margin: 0;
    }

    @media (max-height: 620px) {
        .page {
            padding-block: 1rem;
        }

        .card {
            max-height: calc(100dvh - 2rem);
            overflow: auto;
        }

        .brand {
            padding-block: 1.4rem 1.2rem;
        }

        .body {
            padding-block: 1.2rem 1.4rem;
        }
    }
</style>
