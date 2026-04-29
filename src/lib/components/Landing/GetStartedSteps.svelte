<!-- created by Aaron Meche -->
<script>

</script>

<!--  -->

<section class="how">
    <div class="how-step">
        <div class="step-num">1</div>
        <div class="step-text">
            <div class="step-title">Sign in with Google</div>
            <div class="step-desc">One click, no password. Simple, easy, and quick.</div>
        </div>
    </div>
    <div class="how-divider"></div>
    <div class="how-step">
        <div class="step-num">2</div>
        <div class="step-text">
            <div class="step-title">Add your Steam ID</div>
            <div class="step-desc">Paste your 17-digit Steam ID in your profile to link your library.</div>
        </div>
    </div>
    <div class="how-divider"></div>
    <div class="how-step">
        <div class="step-num">3</div>
        <div class="step-text">
            <div class="step-title">Explore & discover</div>
            <div class="step-desc">Let GameSage surface what to play next, what to buy, and what your friends are into.</div>
        </div>
    </div>
</section>

<!--  -->

<style>
    .how {
        width: 100%;
        max-width: 42rem;
        display: flex;
        align-items: center;
        background: hsl(212, 24%, 12%, 0.58);
        border-radius: 1.2rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.52);
        padding: 2rem;
        flex-wrap: wrap;
        backdrop-filter: blur(24px) saturate(1.22);
        -webkit-backdrop-filter: blur(24px) saturate(1.22);
    }

    .how-step {
        flex: 1;
        min-width: 10rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
        text-align: center;
        padding: 0 1rem;
    }

    .step-num {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 50%;
        background: var(--la1);
        color: var(--bright-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.88rem;
        font-weight: 800;
        outline: solid 1pt var(--la3);
    }

    .step-title { font-size: 0.88rem; font-weight: 700; margin-bottom: 0.2rem; }
    .step-desc  { font-size: 0.76rem; opacity: 0.45; line-height: 1.5; }

    .how-divider {
        width: 1pt;
        height: 3rem;
        margin: auto;
        background: var(--l3);
        flex-shrink: 0;
    }
</style>
