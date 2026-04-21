<script>
    import { onMount } from 'svelte'
    import { Algorithm } from '$lib/algorithm'
    import ContinuePlaying from '$lib/components/Dashboard/ContinuePlaying.svelte'
    import SuggestRow      from '$lib/components/Dashboard/SuggestRow.svelte'
    import QuickStats      from '$lib/components/Dashboard/QuickStats.svelte'
    import ActivityFeed    from '$lib/components/Dashboard/ActivityFeed.svelte'

    const algo = new Algorithm()

    let playSuggestions = $state([])
    let buySuggestions  = $state([])
    let playLoading     = $state(true)
    let buyLoading      = $state(true)

    onMount(() => {
        algo.getPlaySuggestions().then(s => { playSuggestions = s; playLoading = false })
        algo.getBuySuggestions().then(s => { buySuggestions  = s; buyLoading  = false })
    })
</script>

<div class="dashboard">

    <section class="hero-section">
        <ContinuePlaying />
    </section>

    <div class="main-grid">
        <div class="left-col">
            <SuggestRow
                title="Suggested for You"
                type="play"
                items={playSuggestions}
                loading={playLoading}
            />
            <SuggestRow
                title="New Games to Explore"
                type="buy"
                items={buySuggestions}
                loading={buyLoading}
            />
        </div>

        <aside class="right-col">
            <div class="panel">
                <h3 class="panel-title">
                    <i class="fa-solid fa-chart-simple"></i>
                    Your Stats
                </h3>
                <QuickStats />
            </div>

            <div class="panel">
                <h3 class="panel-title">
                    <i class="fa-solid fa-user-group"></i>
                    Friend Activity
                </h3>
                <ActivityFeed />
            </div>
        </aside>
    </div>

</div>

<style>
    .dashboard {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .main-grid {
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 3fr); /* ← this is the key */
        gap: 2.4rem;
        align-items: start;
    }

    .left-col {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
    }

    .right-col {
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        position: sticky;
        top: 2.4rem;
    }

    .panel {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
    }

    .panel-title {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin: 0;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        opacity: 0.55;
    }
</style>
