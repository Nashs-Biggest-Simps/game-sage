<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { page } from '$app/state'
    import EmptyState from '$lib/components/layout/EmptyState.svelte'

    let legacyId = $derived(page.url.searchParams.get('id'))

    $effect(() => {
        if (legacyId) {
            goto(resolve(`/view/${legacyId}`), { replaceState: true })
        }
    })
</script>

{#if !legacyId}
    <EmptyState icon="gamepad" title="No game selected." description="Use the dashboard, library, or search pages to open a game detail view." />
{/if}
