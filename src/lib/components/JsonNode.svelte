<script>
    let { keyName = null, value, depth = 0 } = $props()

    let expanded = $state(depth < 2)

    let isArr  = $derived(Array.isArray(value))
    let isObj  = $derived(value !== null && typeof value === 'object')
    let entries = $derived(
        isArr
            ? value.map((v, i) => [String(i), v])
            : isObj ? Object.entries(value) : []
    )
    let summary = $derived(
        isArr ? `Array(${value.length})`
              : isObj ? `{${Object.keys(value).length} key${Object.keys(value).length !== 1 ? 's' : ''}}`
              : ''
    )

    function valClass(v) {
        if (v === null)            return 'null'
        if (typeof v === 'string') return 'str'
        if (typeof v === 'number') return 'num'
        if (typeof v === 'boolean') return 'bool'
        return ''
    }

    function display(v) {
        if (v === null)            return 'null'
        if (typeof v === 'string') return `"${v.length > 120 ? v.slice(0, 120) + '…' : v}"`
        return String(v)
    }
</script>

<div class="node">
    <div class="row" class:clickable={isObj} onclick={isObj ? () => expanded = !expanded : null}>
        {#if isObj}
            <span class="chevron">{expanded ? '▾' : '▸'}</span>
        {:else}
            <span class="chevron invis">·</span>
        {/if}

        {#if keyName !== null}
            <span class="key">{keyName}</span>
            <span class="colon">:</span>
        {/if}

        {#if isObj}
            {#if !expanded}
                <span class="summary">{summary}</span>
            {:else}
                <span class="brace">{isArr ? '[' : '{'}</span>
            {/if}
        {:else}
            <span class="val {valClass(value)}">{display(value)}</span>
        {/if}
    </div>

    {#if isObj && expanded}
        <div class="children">
            {#each entries as [k, v] (k)}
                <svelte:self keyName={k} value={v} depth={depth + 1} />
            {/each}
        </div>
        <div class="close-brace row">
            <span class="chevron invis">·</span>
            <span class="brace">{isArr ? ']' : '}'}</span>
        </div>
    {/if}
</div>

<style>
    .node {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.78rem;
        line-height: 1.6;
    }

    .row {
        display: flex;
        align-items: baseline;
        gap: 0.2rem;
        padding: 0.05rem 0;
        border-radius: 0.25rem;
        user-select: text;
    }

    .row.clickable {
        cursor: pointer;
    }

    .row.clickable:hover {
        background: hsl(0, 0%, 100%, 0.04);
    }

    .chevron {
        font-size: 0.65rem;
        width: 0.8rem;
        flex-shrink: 0;
        text-align: center;
        opacity: 0.5;
    }

    .chevron.invis { opacity: 0; pointer-events: none; }

    .key {
        color: hsl(210, 80%, 72%);
        font-weight: 600;
        flex-shrink: 0;
    }

    .colon { opacity: 0.4; flex-shrink: 0; }

    .summary {
        color: hsl(0, 0%, 100%, 0.3);
        font-style: italic;
        font-size: 0.73rem;
    }

    .brace { opacity: 0.55; }

    .val        { word-break: break-all; }
    .val.str    { color: hsl(120, 50%, 65%); }
    .val.num    { color: hsl(30, 90%, 68%); }
    .val.bool   { color: hsl(280, 70%, 72%); }
    .val.null   { color: hsl(0, 60%, 65%); opacity: 0.7; font-style: italic; }

    .children {
        padding-left: 1.1rem;
        border-left: 1px solid hsl(0, 0%, 100%, 0.06);
        margin-left: 0.35rem;
    }

    .close-brace { margin-left: 0; }
</style>
