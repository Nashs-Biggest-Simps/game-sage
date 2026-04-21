<!-- created by Aaron Meche -->
<script>

    const FEATURES = [
        { icon: 'square-poll-vertical', title: 'Smart Dashboard',    desc: 'See what you\'ve been playing, your stats, and friend activity at a glance.'   },
        { icon: 'wand-magic-sparkles',  title: 'AI Suggestions',     desc: 'Get personalized play and buy recommendations powered by Claude AI.'           },
        { icon: 'grip',                 title: 'Library Browser',    desc: 'Browse your entire Steam library with filters, playtime, and genre sorting.'    },
        { icon: 'user-group',           title: 'Friend Activity',    desc: 'See what your Steam friends are playing right now in real time.'                },
    ]
</script>

<!--  -->

<section class="features">
    <div class="features-label">What's inside</div>
    <div class="features-grid">
        {#each FEATURES as f}
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fa-solid fa-{f.icon}"></i>
                </div>
                <div class="feature-body">
                    <div class="feature-title">{f.title}</div>
                    <div class="feature-desc">{f.desc}</div>
                </div>
            </div>
        {/each}
    </div>
</section>

<!--  -->

<style>
    .features {
        width: 100%;
        max-width: 56rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    .features-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.4;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
        gap: 1rem;
    }

    .feature-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.4rem;
        background: var(--lb0);
        border-radius: 1.1rem;
        outline: solid 1pt var(--l3);
    }

    .feature-icon {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 0.65rem;
        background: var(--la1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--bright-accent);
        font-size: 0.9rem;
        flex-shrink: 0;
        outline: solid 1pt var(--la3);
    }

    .feature-body { display: flex; flex-direction: column; gap: 0.3rem; }
    .feature-title { font-size: 0.92rem; font-weight: 700; }
    .feature-desc  { font-size: 0.8rem; opacity: 0.5; line-height: 1.5; }
</style>