<!-- created by Aaron Meche -->
<script>
	import { resolve } from '$app/paths'

</script>

<!--  -->

<header class="hero">
    <div class="hero-content">
        <div class="logo-mark">
            <i class="fa-solid fa-hat-wizard"></i>
        </div>
        <h1 class="headline">Your Steam library,<br />finally organized.</h1>
        <p class="sub">GameSage transforms your Steam library into a smart gaming hub — with AI-powered suggestions, rich stats, and friend activity all in one place.</p>
        <div class="cta-row">
            <a class="btn-primary" href={resolve('/login')}>
                <i class="fa-brands fa-google"></i>
                Get started free
            </a>
            <span class="cta-note">Sign in with Google · No password needed</span>
        </div>
    </div>
    <div class="hero-glow"></div>
</header>

<!--  -->

<style>
    .hero {
        position: relative;
        width: 100%;
        max-width: 56rem;
        padding-top: 7rem;
        padding-bottom: 2rem;
        display: flex;
        justify-content: center;
        overflow: hidden;
    }

    .hero-glow {
        position: absolute;
        top: -4rem;
        left: 50%;
        transform: translateX(-50%);
        width: 40rem;
        height: 24rem;
        background: radial-gradient(ellipse, hsl(212, 75%, 50%, 0.14) 0%, transparent 70%);
        pointer-events: none;
    }

    .hero-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.4rem;
        max-width: 42rem;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.9rem 2rem;
        background: var(--accent);
        border-radius: 0.75rem;
        font-size: 0.95rem;
        font-weight: 700;
        color: white;
        cursor: pointer;
        transition: background 150ms, transform 120ms, box-shadow 150ms;
        box-shadow: 0 8px 24px hsl(212, 75%, 50%, 0.3);
    }

    .btn-primary:hover {
        background: var(--bright-accent);
        transform: translateY(-2px);
        box-shadow: 0 12px 32px hsl(212, 75%, 50%, 0.4);
    }

    .cta-note {
        font-size: 0.75rem;
        opacity: 0.35;
    }

    .logo-mark {
        width: 4rem;
        height: 4rem;
        border-radius: 1.1rem;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.7rem;
        color: white;
        box-shadow: 0 12px 36px hsl(212, 75%, 50%, 0.4);
        margin-bottom: 0.4rem;
    }

    .headline {
        font-size: clamp(2.2rem, 5vw, 3.4rem);
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.03em;
        margin: 0;
    }

    .sub {
        font-size: 1rem;
        line-height: 1.65;
        opacity: 0.55;
        max-width: 34rem;
        margin: 0;
    }

    .cta-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7rem;
        margin-top: 0.4rem;
    }
</style>