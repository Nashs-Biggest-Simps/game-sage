<script>
    import GameCardRail from '$lib/components/game-cards/GameCardRail.svelte'
    import RowLayoutToggle from '$lib/components/game-cards/RowLayoutToggle.svelte'

    let {
        games = [],
        icon,
        title,
        subtitle = null,
        badgeLabel = null,
        badgeIcon = null,
        badgeVariant = 'default',
        loading = false,
        skeletonCount = 5,
        ghostCount = 0,
    } = $props()

    let mode = $state('scroll')
</script>

<section class="row-section">
    <div class="row-header">
        <div class="row-heading">
            <div class="row-title">
                {#if icon}
                    <i class={icon}></i>
                {/if}
                {title}
            </div>

            {#if subtitle || badgeLabel}
                <div class="row-meta">
                    {#if subtitle}
                        <span class="sub">{subtitle}</span>
                    {/if}

                    {#if badgeLabel}
                        <span class="badge {badgeVariant}">
                            {#if badgeIcon}
                                <i class={badgeIcon}></i>
                            {/if}
                            {badgeLabel}
                        </span>
                    {/if}
                </div>
            {/if}
        </div>

        <RowLayoutToggle bind:value={mode} />
    </div>

    <GameCardRail {games} {mode} {loading} {skeletonCount} {ghostCount} />
</section>

<style>
    .row-section {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .row-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .row-heading {
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.55rem 0.75rem;
    }

    .row-title {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.15rem;
        font-weight: 700;
        line-height: 1.25;
    }

    .row-meta {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.45rem;
    }

    .sub {
        font-size: 0.72rem;
        opacity: 0.44;
        white-space: nowrap;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 0.16rem 0.56rem;
        border-radius: 100vh;
        background: var(--la1);
        color: var(--bright-accent);
        outline: solid 1pt var(--la3);
        white-space: nowrap;
    }

    .badge i {
        font-size: 0.6rem;
    }

    .badge.buy,
    .badge.live {
        background: hsl(146, 48%, 20%, 0.44);
        color: hsl(146, 72%, 70%);
        outline-color: hsl(146, 48%, 40%, 0.5);
    }

    @media (max-width: 620px) {
        .row-header {
            align-items: center;
        }

        .row-title {
            font-size: 1rem;
        }
    }
</style>
