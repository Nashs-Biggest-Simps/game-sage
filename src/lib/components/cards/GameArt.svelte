<script>
    import { getSteamCapsuleCandidates, getSteamHeroCandidates } from '$lib/steam-media'

    let {
        appid = null,
        title = '',
        sources = [],
        mode = 'capsule',
        eager = false,
        shade = true,
        children,
    } = $props()

    let sourceIndex = $state(0)

    let fallbackSources = $derived(mode === 'hero'
        ? getSteamHeroCandidates(appid)
        : getSteamCapsuleCandidates(appid))
    let mergedSources = $derived([...new Set([...(sources ?? []).filter(Boolean), ...fallbackSources])])
    let currentSource = $derived(mergedSources[sourceIndex] ?? null)

    $effect(() => {
        appid
        sources
        sourceIndex = 0
    })

    function nextSource() {
        sourceIndex += 1
    }
</script>

<div class="art" class:hero={mode === 'hero'}>
    {#if currentSource}
        <img
            src={currentSource}
            alt={title}
            loading={eager ? 'eager' : 'lazy'}
            onerror={nextSource}
        />
    {:else}
        <div class="placeholder"></div>
    {/if}

    {#if shade}
        <div class="shade"></div>
    {/if}

    <div class="overlay">
        {@render children?.()}
    </div>
</div>

<style>
    .art {
        position: relative;
        overflow: hidden;
        aspect-ratio: 616 / 353;
        background:
            radial-gradient(circle at top left, hsl(211, 76%, 45%, 0.22), transparent 48%),
            linear-gradient(135deg, hsl(214, 36%, 20%), hsl(214, 30%, 12%));
    }

    .art.hero {
        aspect-ratio: 16 / 8.6;
    }

    img,
    .placeholder {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent, hsl(220, 30%, 8%, 0.5));
        pointer-events: none;
    }

    .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        pointer-events: none;
    }

    .overlay :global(*) {
        pointer-events: auto;
    }
</style>
