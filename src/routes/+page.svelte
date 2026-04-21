<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import Features from '$lib/components/Landing/Features.svelte';
    import GetStartedSteps from '$lib/components/Landing/GetStartedSteps.svelte';
    import Hero from '$lib/components/Landing/Hero.svelte';
    import { db } from '$lib/data'

    $effect(() => {
        if ($db?.user?.uid) goto(resolve('/dashboard'))
    })
</script>

<div class="landing">
    <Hero />
    <Features />
    <GetStartedSteps />

    <div class="footer-cta">
        <a class="btn-primary large" href={resolve('/login')}>
            <i class="fa-solid fa-hat-wizard"></i>
            Open GameSage
        </a>
    </div>
    

</div>

<style>
    .landing {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5rem;
        padding: 0 var(--inline-moat) 6rem;
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

    .btn-primary.large { padding: 1rem 2.6rem; font-size: 1.05rem; }

    .footer-cta {
        display: flex;
        justify-content: center;
    }
</style>
