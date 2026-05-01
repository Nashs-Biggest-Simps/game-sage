<script>
    import { resolveThumbnail } from '$lib/cache'
    import { db } from '$lib/data'

    let {
        appid,
        alt = '',
        className = '',
        decorative = false,
        renderFallback = true,
        onUnavailable = null,
    } = $props()

    let imageIndex = $state(0)
    let reportedUnavailable = $state(false)
    let cachedDetail = $derived($db?.cache?.library?.details?.[appid]?.data ?? null)

    let sources = $derived(
        [...new Set([
            cachedDetail?.thumbnail,
            appid ? resolveThumbnail(appid) : null,
            `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
            `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`,
            `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_hero.jpg`,
        ].filter(Boolean))]
    )

    let src = $derived(sources[imageIndex] ?? null)

    $effect(() => {
        appid
        cachedDetail?.thumbnail
        imageIndex = 0
        reportedUnavailable = false
    })

    function handleError() {
        const nextIndex = imageIndex + 1
        if (nextIndex >= sources.length && !reportedUnavailable) {
            reportedUnavailable = true
            onUnavailable?.(appid)
        }
        imageIndex = nextIndex
    }
</script>

{#if src}
    <img
        class={className}
        src={src}
        alt={decorative ? '' : alt}
        aria-hidden={decorative}
        loading="lazy"
        decoding="async"
        onerror={handleError}
    />
{:else if renderFallback}
    <div class={className} aria-hidden="true"></div>
{/if}
