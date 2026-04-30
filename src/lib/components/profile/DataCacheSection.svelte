<script>
    import { db } from '$lib/data'
    import JsonTreeNode from '$lib/components/profile/JsonTreeNode.svelte'

    let {
        saveStatus = null,
        confirmHardReset = false,
        dbExpanded = $bindable(false),
        onRefreshLibrary = () => {},
        onClearSuggestions = () => {},
        onClearSteamConnection = () => {},
        onHardReset = () => {},
    } = $props()
</script>

<section class="panel panel-lg">
    <h2 class="panel-heading">Data &amp; Cache</h2>
    <p class="panel-desc">GameSage stores your Steam library locally to speed up load times and reduce API usage.</p>

    <div class="data-grid">
        <div class="data-card">
            <div class="data-title"><i class="fa-solid fa-rotate"></i> Refresh Library</div>
            <p class="data-desc">Clear cached Steam library data and re-fetch it. Use this after changing Steam privacy settings to public.</p>
            <button class="btn-ghost" onclick={onRefreshLibrary}>Refresh Now</button>
        </div>
        <div class="data-card">
            <div class="data-title"><i class="fa-solid fa-wand-magic-sparkles"></i> Reset Suggestions</div>
            <p class="data-desc">Clears AI suggestion cache and feedback memory so recommendations can regenerate from current preferences.</p>
            <button class="btn-ghost" onclick={onClearSuggestions}>Clear Suggestions</button>
        </div>
        <div class="data-card">
            <div class="data-title"><i class="fa-brands fa-steam"></i> Unlink Steam</div>
            <p class="data-desc">Remove the saved Steam ID and all Steam-derived cache without signing out of Google.</p>
            <button class="btn-ghost" onclick={onClearSteamConnection}>Unlink Steam</button>
        </div>
        <div class="data-card danger-card">
            <div class="data-title"><i class="fa-solid fa-bomb"></i> Hard Reset</div>
            <p class="data-desc">Clears the entire browser local storage store, signs out, and returns GameSage to a fresh first-run state.</p>
            <button class="btn-danger" onclick={onHardReset}>
                {confirmHardReset ? 'Confirm Reset' : 'Hard Reset'}
            </button>
        </div>
    </div>

    {#if saveStatus === 'refreshed'}
        <span class="status ok"><i class="fa-solid fa-circle-check"></i> Cache cleared — refreshing…</span>
    {:else if saveStatus === 'suggestions-cleared'}
        <span class="status ok"><i class="fa-solid fa-circle-check"></i> Suggestions cleared</span>
    {:else if saveStatus === 'steam-cleared'}
        <span class="status ok"><i class="fa-solid fa-circle-check"></i> Steam connection removed</span>
    {:else if saveStatus === 'error'}
        <span class="status err-msg"><i class="fa-solid fa-circle-xmark"></i> Add a valid Steam ID before refreshing</span>
    {/if}
</section>

<section class="panel panel-lg viewer-panel">
    <div class="viewer-header">
        <div>
            <h2 class="panel-heading">Data Viewer</h2>
            <p class="panel-desc">Live view of the local DB store. Click any object or array to expand or collapse it.</p>
        </div>
        <button class="btn-ghost viewer-toggle" onclick={() => dbExpanded = !dbExpanded}>
            {dbExpanded ? 'Collapse All' : 'Expand All'}
        </button>
    </div>
    <div class="json-tree">
        {#key dbExpanded}
            <JsonTreeNode value={$db} depth={dbExpanded ? 99 : 0} />
        {/key}
    </div>
</section>

<style>
    .data-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }
    .data-card {
        background: var(--l1);
        border-radius: 0.9rem;
        outline: solid 1pt var(--l3);
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }
    .data-card.danger-card { outline-color: hsl(0, 50%, 28%); }
    .data-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; font-weight: 700; }
    .data-desc { font-size: 0.78rem; opacity: 0.5; line-height: 1.5; margin: 0; flex: 1; }
    .viewer-panel { gap: 1.2rem; }
    .viewer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }
    .viewer-toggle { flex-shrink: 0; font-size: 0.82rem; padding: 0.45rem 1rem; }
    .json-tree {
        background: hsl(220, 15%, 8%);
        border-radius: 0.75rem;
        outline: solid 1pt hsl(220, 15%, 16%);
        padding: 1.1rem 1.2rem;
        overflow-x: auto;
        max-height: 70vh;
        overflow-y: auto;
    }

    @media (max-width: 640px) {
        .viewer-header { align-items: stretch; flex-direction: column; }
    }
</style>
