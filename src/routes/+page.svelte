<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { db } from '$lib/data'

    const HERO_GAMES = [
        730, 570, 1172470, 1086940, 1245620, 1091500, 271590, 292030,
        578080, 1938090, 413150, 252490, 381210, 359550, 1145360, 322330,
        236390, 582010, 553850, 105600, 367520, 239140, 230410, 4000,
    ]

    const FEATURE_GROUPS = [
        {
            icon: 'wand-magic-sparkles',
            title: 'Intelligent recommendations',
            desc: 'Get two kinds of discovery: games you already own and should finally play, plus AI-assisted store picks worth buying next.',
        },
        {
            icon: 'user-group',
            title: 'Advanced friend insights',
            desc: 'See what your friends are playing now, what is trending in your circle, and which games are easier to jump into together.',
        },
        {
            icon: 'chart-simple',
            title: 'Library data that helps',
            desc: 'Turn playtime, genres, recent sessions, achievements, and cached Steam metadata into a clean dashboard you can actually use.',
        },
    ]

    const SIGNALS = [
        ['Library Fit', 'Ranks unplayed games by your real play history'],
        ['Friend Gravity', 'Surfaces games your circle is actively playing'],
        ['Store Discovery', 'Finds buy-worthy Steam games outside your library'],
        ['Fast Cache', 'Keeps repeated browsing smooth and API-light'],
    ]

    $effect(() => {
        if ($db?.user?.uid) goto(resolve('/dashboard'))
    })

    function capsule(appid) {
        return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`
    }
</script>

<svelte:head>
    <title>GameSage | Steam Library Intelligence</title>
</svelte:head>

<div class="landing">
    <section class="hero-shell">
        <div class="game-marquee" aria-hidden="true">
            {#each [0, 1, 2] as row}
                <div class="marquee-row row-{row}">
                    <div class="marquee-track">
                        {#each [...HERO_GAMES, ...HERO_GAMES] as appid, i (`${row}-${appid}-${i}`)}
                            <img src={capsule(appid)} alt="" draggable="false" />
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

        <nav class="landing-nav" aria-label="Landing navigation">
            <a href={resolve('/')} class="brand">
                <span class="brand-mark"><i class="fa-solid fa-hat-wizard"></i></span>
                <span>GameSage</span>
            </a>
            <a class="nav-login" href={resolve('/login')}>Sign in</a>
        </nav>

        <div class="hero-copy">
            <h1>Your Steam library,<br />finally organized.</h1>
            <p>
                GameSage transforms your Steam account into a polished command center for what to play next,
                what to buy, and what your friends are actually playing.
            </p>
            <div class="hero-actions">
                <a class="btn-primary" href={resolve('/login')}>
                    <i class="fa-brands fa-google"></i>
                    Get started free
                </a>
                <span class="action-note">Connect Google, add Steam ID, start discovering.</span>
            </div>
        </div>
    </section>

    <section class="signal-strip">
        {#each SIGNALS as [title, desc]}
            <div class="signal">
                <div class="signal-title">{title}</div>
                <div class="signal-desc">{desc}</div>
            </div>
        {/each}
    </section>

    <section class="feature-showcase">
        <div class="section-copy">
            <h2>Built for your backlog, your friends, and your next obsession.</h2>
            <p>
                GameSage combines your owned games, playtime patterns, Steam metadata, and live friend activity
                into a browsing experience that feels faster and smarter than Steam alone.
            </p>
        </div>

        <div class="feature-grid">
            {#each FEATURE_GROUPS as feature}
                <article class="feature-card">
                    <div class="feature-icon"><i class="fa-solid fa-{feature.icon}"></i></div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                </article>
            {/each}
        </div>
    </section>

    <section class="intelligence-panel">
        <div class="panel-copy">
            <h2>Suggestions that know the difference between “play” and “buy.”</h2>
            <p>
                GameSage separates owned-library recommendations from store discovery, so your dashboard does not
                mix games you already own with games you might want to pick up next.
            </p>
        </div>

        <div class="recommendation-preview" aria-label="Recommendation preview">
            <div class="rec-row">
                <div>
                    <span class="rec-label">Picked From Your Library</span>
                    <strong>Hades</strong>
                    <small>Fast-session action that matches your roguelike playtime.</small>
                </div>
                <i class="fa-solid fa-play"></i>
            </div>
            <div class="rec-row">
                <div>
                    <span class="rec-label">Picked For You</span>
                    <strong>Deep Rock Galactic</strong>
                    <small>Co-op discovery with strong friend-group potential.</small>
                </div>
                <i class="fa-solid fa-store"></i>
            </div>
            <div class="rec-row muted">
                <div>
                    <span class="rec-label">Friend Insight</span>
                    <strong>3 friends live</strong>
                    <small>Prioritize what is playable with your circle tonight.</small>
                </div>
                <i class="fa-solid fa-user-group"></i>
            </div>
        </div>
    </section>

    <section class="setup-flow">
        <div class="step">
            <span>01</span>
            <h3>Sign in</h3>
            <p>Use Google authentication. No extra password or account setup.</p>
        </div>
        <div class="flow-line"></div>
        <div class="step">
            <span>02</span>
            <h3>Attach Steam</h3>
            <p>Add your 17-digit Steam ID so GameSage can build your local library cache.</p>
        </div>
        <div class="flow-line"></div>
        <div class="step">
            <span>03</span>
            <h3>Explore smarter</h3>
            <p>Open a dashboard tuned around your games, friends, sessions, and suggestions.</p>
        </div>
    </section>

    <section class="final-cta">
        <h2>Make your Steam library feel intentional again.</h2>
        <a class="btn-primary large" href={resolve('/login')}>
            <i class="fa-solid fa-hat-wizard"></i>
            Open GameSage
        </a>
    </section>
</div>

<style>
    .landing {
        position: relative;
        min-height: 100vh;
        margin: -2.4rem calc(var(--inline-moat) * -1) -2.4rem;
        padding-bottom: 6rem;
        overflow: hidden;
        background:
            radial-gradient(circle at 18% 22rem, hsl(188, 84%, 48%, 0.12), transparent 32rem),
            radial-gradient(circle at 84% 52rem, hsl(146, 68%, 44%, 0.09), transparent 34rem),
            radial-gradient(circle at 48% 112rem, hsl(218, 80%, 58%, 0.12), transparent 46rem),
            linear-gradient(to bottom, transparent 0%, hsl(212, 30%, 6%, 0.22) 58%, hsl(212, 30%, 6%, 0.3) 100%);
    }

    .landing::before {
        content: '';
        position: absolute;
        inset: -8rem -10vw -8rem;
        pointer-events: none;
        background:
            radial-gradient(circle at 18% 26rem, hsl(188, 84%, 48%, 0.18), transparent 30rem),
            radial-gradient(circle at 82% 30rem, hsl(146, 68%, 44%, 0.14), transparent 28rem),
            radial-gradient(circle at 52% 72rem, hsl(218, 80%, 58%, 0.14), transparent 42rem),
            radial-gradient(circle at 88% 132rem, hsl(188, 70%, 44%, 0.09), transparent 34rem),
            radial-gradient(circle at 16% 162rem, hsl(146, 68%, 44%, 0.08), transparent 38rem);
        z-index: 0;
    }

    .landing > * {
        position: relative;
        z-index: 1;
    }

    .hero-shell {
        position: relative;
        min-height: 80vh;
        padding-inline: var(--inline-moat);
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }

    .game-marquee {
        position: absolute;
        inset: 0;
        height: 82vh;
        min-height: 41rem;
        overflow: hidden;
        opacity: 0.72;
        pointer-events: none;
        mask-image: linear-gradient(to bottom, black 0%, black 42%, hsl(0, 0%, 0%, 0.72) 62%, transparent 100%);
        -webkit-mask-image: linear-gradient(to bottom, black 0%, black 42%, hsl(0, 0%, 0%, 0.72) 62%, transparent 100%);
    }

    .game-marquee::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
            linear-gradient(to bottom, hsl(212, 30%, 6%, 0.16), hsl(212, 30%, 6%, 0.52) 72%, hsl(212, 30%, 6%, 0.18)),
            radial-gradient(circle at 50% 36%, transparent 0%, hsl(0, 0%, 0%, 0.42) 80%);
        pointer-events: none;
    }

    .marquee-row {
        width: max-content;
        transform: rotate(-3deg) translateX(-10rem);
        margin-block: -0.2rem;
    }

    .row-1 { transform: rotate(-3deg) translateX(-24rem); opacity: 0.74; }
    .row-2 { transform: rotate(-3deg) translateX(-7rem); opacity: 0.54; }

    .marquee-track {
        display: flex;
        gap: 1.5rem;
        animation: marquee 232s linear infinite;
        will-change: transform;
    }

    .row-1 .marquee-track {
        animation-duration: 268s;
        animation-direction: reverse;
    }

    .row-2 .marquee-track {
        animation-duration: 296s;
    }

    .marquee-track img {
        width: clamp(22rem, 30vw, 39rem);
        aspect-ratio: 616 / 353;
        object-fit: cover;
        border-radius: 1rem;
        opacity: 0.88;
        box-shadow: 0 18px 48px hsl(0, 0%, 0%, 0.34);
        outline: solid 1pt hsl(0, 0%, 100%, 0.1);
        user-select: none;
    }

    .landing-nav {
        position: absolute;
        top: 1.4rem;
        left: var(--inline-moat);
        right: var(--inline-moat);
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 3;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        font-size: 1.05rem;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .brand-mark {
        width: 2.3rem;
        height: 2.3rem;
        border-radius: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(212, 75%, 50%, 0.86);
        box-shadow: 0 12px 30px hsl(212, 75%, 50%, 0.32);
    }

    .nav-login {
        padding: 0.55rem 1rem;
        border-radius: 100vh;
        background: hsl(212, 24%, 12%, 0.5);
        outline: solid 1pt hsl(212, 38%, 36%, 0.5);
        backdrop-filter: blur(18px) saturate(1.25);
        font-size: 0.84rem;
        font-weight: 700;
    }

    .hero-copy {
        position: relative;
        z-index: 2;
        width: min(42rem, 100%);
        margin-top: clamp(11rem, 27vh, 17rem);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .hero-copy h1 {
        margin: 0;
        font-size: clamp(2.55rem, 5.7vw, 4.85rem);
        line-height: 0.98;
        letter-spacing: -0.06em;
        font-weight: 900;
        text-shadow: 0 22px 70px hsl(0, 0%, 0%, 0.72);
    }

    .hero-copy p {
        margin: 0;
        max-width: 36rem;
        font-size: clamp(0.92rem, 1.25vw, 1.05rem);
        line-height: 1.58;
        color: hsl(212, 25%, 86%, 0.66);
    }

    .hero-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.68rem;
        justify-content: center;
        margin-top: 0.25rem;
    }

    .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        padding: 0.78rem 1.3rem;
        background: linear-gradient(135deg, var(--accent), hsl(188, 80%, 44%));
        border-radius: 0.82rem;
        font-size: 0.88rem;
        font-weight: 800;
        color: white;
        cursor: pointer;
        box-shadow: 0 18px 46px hsl(212, 75%, 50%, 0.32);
        transition: transform 140ms, box-shadow 140ms, filter 140ms;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        filter: brightness(1.08);
        box-shadow: 0 24px 58px hsl(188, 75%, 46%, 0.28);
    }

    .btn-primary.large {
        padding-inline: 2.1rem;
    }

    .action-note {
        font-size: 0.74rem;
        color: hsl(212, 20%, 84%, 0.48);
    }

    .signal-strip,
    .feature-showcase,
    .intelligence-panel,
    .setup-flow,
    .final-cta {
        width: min(72rem, calc(100% - var(--inline-moat) * 2));
        margin-inline: auto;
    }

    .signal-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1px;
        border-radius: 1.1rem;
        overflow: hidden;
        outline: solid 1pt hsl(212, 32%, 34%, 0.34);
        background: hsl(212, 28%, 28%, 0.2);
        backdrop-filter: blur(22px) saturate(1.16);
        -webkit-backdrop-filter: blur(22px) saturate(1.16);
    }

    .signal {
        padding: 1rem;
        background: hsl(212, 24%, 11%, 0.4);
    }

    .signal-title {
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: hsl(188, 78%, 70%);
        margin-bottom: 0.45rem;
    }

    .signal-desc {
        font-size: 0.74rem;
        line-height: 1.45;
        color: hsl(212, 18%, 84%, 0.58);
    }

    .feature-showcase {
        margin-top: 5.5rem;
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
        gap: 2rem;
        align-items: start;
    }

    .section-copy {
        padding-top: 0.35rem;
    }

    .section-copy h2,
    .panel-copy h2,
    .final-cta h2 {
        margin: 0;
        font-size: clamp(1.55rem, 3vw, 2.65rem);
        line-height: 1.05;
        letter-spacing: -0.045em;
    }

    .section-copy p,
    .panel-copy p {
        margin: 0.85rem 0 0;
        font-size: 0.9rem;
        line-height: 1.58;
        color: hsl(212, 18%, 84%, 0.56);
    }

    .feature-grid {
        display: grid;
        gap: 0.75rem;
    }

    .feature-card,
    .intelligence-panel,
    .step,
    .final-cta {
        background: hsl(212, 24%, 11%, 0.42);
        outline: solid 1pt hsl(212, 34%, 34%, 0.34);
        backdrop-filter: blur(24px) saturate(1.18);
        -webkit-backdrop-filter: blur(24px) saturate(1.18);
        box-shadow: 0 18px 54px hsl(0, 0%, 0%, 0.18), inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
    }

    .feature-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 1rem;
        align-items: start;
        background:
            linear-gradient(135deg, hsl(212, 24%, 13%, 0.5), hsl(212, 24%, 9%, 0.36)),
            hsl(212, 24%, 11%, 0.38);
    }

    .feature-icon {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(188, 70%, 42%, 0.16);
        color: hsl(188, 80%, 70%);
        outline: solid 1pt hsl(188, 70%, 48%, 0.28);
        grid-row: 1 / span 2;
    }

    .feature-card h3 {
        grid-column: 2;
        margin: 0 0 0.35rem;
        font-size: 0.95rem;
    }

    .feature-card p {
        grid-column: 2;
        margin: 0;
        color: hsl(212, 18%, 84%, 0.58);
        line-height: 1.55;
        font-size: 0.8rem;
    }

    .intelligence-panel {
        margin-top: 5rem;
        border-radius: 1.25rem;
        padding: clamp(1.15rem, 3vw, 2rem);
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(20rem, 1fr);
        gap: 2rem;
        align-items: center;
    }

    .recommendation-preview {
        display: grid;
        gap: 0.65rem;
    }

    .rec-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 0.82rem;
        border-radius: 0.82rem;
        background: hsl(212, 26%, 9%, 0.42);
        outline: solid 1pt hsl(212, 34%, 32%, 0.34);
    }

    .rec-label {
        display: block;
        font-size: 0.58rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: hsl(188, 80%, 72%);
        margin-bottom: 0.28rem;
    }

    .rec-row strong {
        display: block;
        font-size: 0.92rem;
        margin-bottom: 0.22rem;
    }

    .rec-row small {
        display: block;
        line-height: 1.45;
        color: hsl(212, 18%, 84%, 0.52);
        font-size: 0.74rem;
    }

    .rec-row i {
        width: 2rem;
        height: 2rem;
        border-radius: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background: hsl(212, 75%, 50%, 0.42);
    }

    .rec-row.muted i {
        background: hsl(146, 55%, 38%, 0.35);
    }

    .setup-flow {
        margin-top: 5rem;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
        gap: 0.75rem;
        align-items: stretch;
    }

    .step {
        border-radius: 1rem;
        padding: 1rem;
    }

    .step span {
        color: hsl(188, 80%, 70%);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.12em;
    }

    .step h3 {
        margin: 0.75rem 0 0.35rem;
        font-size: 0.94rem;
    }

    .step p {
        margin: 0;
        color: hsl(212, 18%, 84%, 0.55);
        line-height: 1.55;
        font-size: 0.78rem;
    }

    .flow-line {
        width: 3rem;
        height: 1px;
        align-self: center;
        background: linear-gradient(to right, transparent, hsl(188, 70%, 60%, 0.5), transparent);
    }

    .final-cta {
        margin-top: 5rem;
        border-radius: 1.3rem;
        padding: 2.4rem 1.6rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.6rem;
    }

    @keyframes marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
    }

    @media (prefers-reduced-motion: reduce) {
        .marquee-track {
            animation: none;
        }
    }

    @media (max-width: 900px) {
        .hero-shell {
            min-height: 78vh;
        }

        .signal-strip,
        .feature-showcase,
        .intelligence-panel,
        .setup-flow {
            grid-template-columns: minmax(0, 1fr);
        }

        .feature-showcase {
            gap: 1.3rem;
        }

        .flow-line {
            width: 1px;
            height: 2rem;
            justify-self: center;
        }
    }

    @media (max-width: 620px) {
        .landing {
            margin-top: -1.6rem;
        }

        .landing-nav {
            left: 1rem;
            right: 1rem;
        }

        .hero-shell {
            padding-inline: 1rem;
            min-height: 80vh;
        }

        .hero-copy {
            margin-top: 10rem;
        }

        .hero-copy h1 {
            font-size: clamp(2.25rem, 12vw, 3.5rem);
        }

        .game-marquee {
            min-height: 34rem;
        }

        .marquee-track img {
            width: 19rem;
            border-radius: 0.8rem;
        }

        .signal-strip,
        .feature-showcase,
        .intelligence-panel,
        .setup-flow,
        .final-cta {
            width: calc(100% - 2rem);
        }

        .signal-strip {
            grid-template-columns: minmax(0, 1fr);
        }

        .feature-card {
            grid-template-columns: minmax(0, 1fr);
        }

        .feature-icon,
        .feature-card h3,
        .feature-card p {
            grid-column: 1;
        }

        .feature-icon {
            grid-row: auto;
        }
    }
</style>
