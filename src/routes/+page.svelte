<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { db, hasAppSession, startGuestSession } from '$lib/data'
    import PageHeader from '$lib/components/layout/PageHeader.svelte'
    import SurfacePanel from '$lib/components/layout/SurfacePanel.svelte'

    const FEATURES = [
        {
            title: 'Know what to play next',
            description: 'GameSage scores your backlog, your current habits, and your friend graph so the dashboard has a useful next move instead of a giant wall of games.',
            icon: 'wand-magic-sparkles',
        },
        {
            title: 'Read your library clearly',
            description: 'Your collection stays filterable, readable, and consistent across library, activity, and search instead of bouncing between unrelated card styles.',
            icon: 'grip',
        },
        {
            title: 'Watch your social orbit',
            description: 'See who is online, what they are actively playing, and where your own recent sessions fit into the bigger picture.',
            icon: 'users',
        },
        {
            title: 'Open any game in context',
            description: 'Each game page keeps trailers, achievements, playtime, news, and store context in one place with a Steam-native visual feel.',
            icon: 'film',
        },
    ]

    const STEPS = [
        'Start as a local guest or connect Google later.',
        'Drop in your 17-digit Steam ID once in Profile.',
        'Let the cache fill your library, activity, and recommendations.',
    ]

    $effect(() => {
        if (hasAppSession($db)) goto(resolve('/dashboard'))
    })

    function continueAsGuest() {
        startGuestSession()
        goto(resolve('/dashboard'))
    }
</script>

<div class="landing-page">
    <section class="hero-shell">
        <PageHeader
            eyebrow="Guest-first Steam companion"
            title="Turn your Steam library into a dashboard that actually helps you choose."
            description="GameSage connects a Steam ID, syncs your library, surfaces friend activity, and gives you reliable recommendations without forcing account friction just to browse your own games."
        >
            <button class="btn-primary" onclick={continueAsGuest}>
                <i class="fa-solid fa-door-open"></i>
                Continue as Guest
            </button>
            <a class="btn-secondary" href={resolve('/login')}>
                <i class="fa-brands fa-google"></i>
                Use Google Instead
            </a>
        </PageHeader>

        <div class="hero-grid">
            <SurfacePanel className="hero-preview" highlight>
                <div class="preview-header">
                    <span class="chip">Dashboard</span>
                    <span class="chip">Steam synced</span>
                </div>
                <div class="preview-hero">
                    <div class="preview-copy">
                        <strong>Continue with Elden Ring</strong>
                        <span>32h total · 5h this week</span>
                    </div>
                    <div class="preview-actions">
                        <span class="btn-primary preview-button">Play</span>
                        <span class="btn-ghost preview-button">View</span>
                    </div>
                </div>
                <div class="preview-stats">
                    <div><strong>148</strong><span>games owned</span></div>
                    <div><strong>67%</strong><span>library explored</span></div>
                    <div><strong>6</strong><span>friends online</span></div>
                </div>
                <div class="preview-row">
                    <div class="mini-card focus">Play Next</div>
                    <div class="mini-card">Worth Buying</div>
                    <div class="mini-card">Friend Activity</div>
                </div>
            </SurfacePanel>

            <div class="hero-side">
                <SurfacePanel dense>
                    <div class="side-stat-label">What you get immediately</div>
                    <ul class="bullet-list">
                        <li>Guest access with no Firebase requirement</li>
                        <li>Steam-driven dashboard, library, and activity views</li>
                        <li>Cached recommendations that do not collapse when AI is unavailable</li>
                    </ul>
                </SurfacePanel>

                <SurfacePanel dense>
                    <div class="side-stat-label">Built for first-time users</div>
                    <p class="side-copy">The first session explains what GameSage is for, where Steam ID fits, and why each page exists before you ever touch profile settings.</p>
                </SurfacePanel>
            </div>
        </div>
    </section>

    <section class="feature-grid">
        {#each FEATURES as feature}
            <SurfacePanel>
                <div class="feature-card">
                    <span class="feature-icon"><i class={`fa-solid fa-${feature.icon}`}></i></span>
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                </div>
            </SurfacePanel>
        {/each}
    </section>

    <section class="info-grid">
        <SurfacePanel>
            <div class="section-label">How it works</div>
            <div class="step-list">
                {#each STEPS as step, index}
                    <div class="step">
                        <span>{index + 1}</span>
                        <p>{step}</p>
                    </div>
                {/each}
            </div>
        </SurfacePanel>

        <SurfacePanel>
            <div class="section-label">Why this is different</div>
            <div class="comparison">
                <div>
                    <strong>Steam is great at access.</strong>
                    <p>GameSage is focused on context: what you are neglecting, what fits your habits, and what is happening around you right now.</p>
                </div>
                <div>
                    <strong>AI is optional, not a single point of failure.</strong>
                    <p>The app ranks candidates deterministically first, then improves the copy when the AI layer is available.</p>
                </div>
            </div>
        </SurfacePanel>
    </section>

    <section class="footer-cta">
        <SurfacePanel className="cta-panel" highlight>
            <div class="cta-copy">
                <strong>Browse as a guest now, connect Google only if you want it.</strong>
                <p>Your Steam ID is the meaningful input. The auth layer is just optional persistence.</p>
            </div>
            <div class="cta-actions">
                <button class="btn-primary" onclick={continueAsGuest}>Open GameSage</button>
                <a class="btn-ghost" href={resolve('/login')}>View login options</a>
            </div>
        </SurfacePanel>
    </section>
</div>

<style>
    .landing-page {
        display: grid;
        gap: 2.2rem;
        padding: 4rem var(--inline-moat) 4rem;
    }

    .hero-shell,
    .feature-grid,
    .info-grid,
    .footer-cta {
        width: min(100%, 78rem);
        margin: 0 auto;
    }

    .hero-shell {
        display: grid;
        gap: 1.6rem;
    }

    .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.85fr);
        gap: 1rem;
    }

    .hero-preview {
        display: grid;
        gap: 1rem;
        padding: 1.4rem;
    }

    .preview-header,
    .preview-stats,
    .preview-row,
    .preview-actions,
    .hero-side {
        display: flex;
    }

    .preview-header,
    .preview-stats,
    .preview-row {
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .preview-hero {
        display: grid;
        gap: 1rem;
        min-height: 17rem;
        align-content: end;
        padding: 1.25rem;
        border-radius: var(--radius-lg);
        background:
            linear-gradient(180deg, transparent, hsl(220, 40%, 8%, 0.8)),
            radial-gradient(circle at top left, hsl(213, 82%, 56%, 0.34), transparent 38%),
            linear-gradient(135deg, hsl(214, 36%, 20%), hsl(215, 30%, 11%));
        border: 1px solid var(--panel-border);
    }

    .preview-copy,
    .cta-copy,
    .comparison,
    .feature-card,
    .step-list,
    .hero-side,
    .info-grid {
        display: grid;
    }

    .preview-copy strong {
        font-size: clamp(1.5rem, 3vw, 2.3rem);
        letter-spacing: -0.04em;
    }

    .preview-copy span,
    .feature-card p,
    .side-copy,
    .step p,
    .comparison p,
    .cta-copy p {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.6;
    }

    .preview-button {
        pointer-events: none;
    }

    .preview-stats div {
        min-width: 8rem;
        display: grid;
        gap: 0.2rem;
        padding: 0.9rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
    }

    .preview-stats strong {
        font-size: 1.3rem;
    }

    .preview-stats span,
    .side-stat-label,
    .section-label,
    .step span {
        color: var(--text-dim);
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .mini-card {
        min-width: 9rem;
        padding: 0.95rem 1rem;
        border-radius: var(--radius-md);
        background: var(--panel-soft);
        border: 1px solid var(--panel-border);
        color: var(--text-muted);
        font-weight: 700;
    }

    .mini-card.focus {
        color: var(--text-primary);
        border-color: var(--panel-border-strong);
        background: var(--accent-soft);
    }

    .hero-side {
        gap: 1rem;
        align-content: start;
    }

    .bullet-list {
        margin: 0;
        padding-left: 1rem;
        display: grid;
        gap: 0.65rem;
        color: var(--text-muted);
    }

    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 1rem;
    }

    .feature-card {
        gap: 0.75rem;
    }

    .feature-icon {
        width: 2.8rem;
        height: 2.8rem;
        display: grid;
        place-items: center;
        border-radius: 0.95rem;
        background: var(--accent-soft);
        color: var(--accent-strong);
        border: 1px solid var(--panel-border-strong);
    }

    .feature-card strong,
    .comparison strong,
    .cta-copy strong {
        font-size: 1.02rem;
        line-height: 1.35;
    }

    .info-grid {
        grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
        gap: 1rem;
    }

    .step-list,
    .comparison,
    .cta-copy {
        gap: 1rem;
    }

    .step {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.9rem;
        align-items: start;
    }

    .step span {
        width: 2.1rem;
        height: 2.1rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        border: 1px solid var(--panel-border-strong);
    }

    .cta-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.35rem;
    }

    .cta-actions {
        display: flex;
        gap: 0.8rem;
        flex-wrap: wrap;
    }

    @media (max-width: 920px) {
        .hero-grid,
        .cta-panel {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>
