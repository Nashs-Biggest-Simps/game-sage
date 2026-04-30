<script>
    import { flip } from 'svelte/animate'
    import { onDestroy } from 'svelte'
    import { db } from '$lib/data'
    import {
        DEFAULT_ACTIVITY_LAYOUT,
        DEFAULT_DASHBOARD_CONTENT_LAYOUT,
        DEFAULT_DASHBOARD_LAYOUT,
        activityModuleLabel,
        dashboardRightColumnItems,
        dashboardContentModuleLabel,
        dashboardModuleLabel,
        normalizeDashboardRightOrder,
        normalizeActivityLayout,
        normalizeDashboardContentLayout,
        normalizeDashboardLayout,
    } from '$lib/dashboardLayout'

    let {
        dashboardAllowColumnChanges = false,
        activityAllowColumnChanges = true,
    } = $props()

    let dashboardLayout = $derived(normalizeDashboardLayout($db?.prefs?.dashboard?.layout))
    let dashboardContentLayout = $derived(normalizeDashboardContentLayout($db?.prefs?.dashboard?.contentLayout))
    let activityLayout  = $derived(normalizeActivityLayout($db?.prefs?.activity?.layout))
    let defaultDashboardLayout = $derived(normalizeDashboardLayout(DEFAULT_DASHBOARD_LAYOUT))
    let defaultDashboardContentLayout = $derived(normalizeDashboardContentLayout(DEFAULT_DASHBOARD_CONTENT_LAYOUT))
    let defaultActivityLayout = $derived(normalizeActivityLayout(DEFAULT_ACTIVITY_LAYOUT))
    let dashboardIsDefault = $derived(layoutItemsMatch(dashboardLayout, defaultDashboardLayout))
    let dashboardContentIsDefault = $derived(columnLayoutsMatch(dashboardContentLayout, defaultDashboardContentLayout))
    let dashboardRightOrder = $derived(normalizeDashboardRightOrder(
        $db?.prefs?.dashboard?.rightOrder,
        dashboardContentLayout,
        dashboardLayout
    ))
    let defaultDashboardRightOrder = $derived(normalizeDashboardRightOrder(
        undefined,
        defaultDashboardContentLayout,
        defaultDashboardLayout
    ))
    let dashboardRightOrderIsDefault = $derived(orderItemsMatch(dashboardRightOrder, defaultDashboardRightOrder))
    let dashboardControlsAreDefault = $derived(dashboardIsDefault && dashboardContentIsDefault && dashboardRightOrderIsDefault)
    let dashboardRightItems = $derived(dashboardRightColumnItems(
        dashboardContentLayout,
        dashboardLayout,
        dashboardRightOrder
    ))
    let activityIsDefault = $derived(columnLayoutsMatch(activityLayout, defaultActivityLayout))
    let prefsSaved      = $state(false)
    let savedTimer = null

    onDestroy(() => {
        if (savedTimer) clearTimeout(savedTimer)
    })

    function setPref(path, value) {
        db.update(data => {
            const prefs = structuredClone(data.prefs ?? {})
            const parts = path.split('.')
            let obj = prefs

            for (let i = 0; i < parts.length - 1; i++) {
                obj[parts[i]] ??= {}
                obj = obj[parts[i]]
            }

            obj[parts[parts.length - 1]] = value
            return { ...data, prefs }
        })
    }

    function markSaved() {
        if (savedTimer) clearTimeout(savedTimer)
        prefsSaved = true
        savedTimer = setTimeout(() => {
            prefsSaved = false
            savedTimer = null
        }, 2000)
    }

    function layoutItemsMatch(a = [], b = []) {
        if (a.length !== b.length) return false

        return a.every((item, index) => (
            item.id === b[index]?.id &&
            item.enabled === b[index]?.enabled
        ))
    }

    function orderItemsMatch(a = [], b = []) {
        if (a.length !== b.length) return false
        return a.every((item, index) => item === b[index])
    }

    function columnLayoutsMatch(a, b) {
        return layoutItemsMatch(a?.left ?? [], b?.left ?? []) &&
            layoutItemsMatch(a?.right ?? [], b?.right ?? [])
    }

    function saveDashboardLayout(layout) {
        setPref('dashboard.layout', normalizeDashboardLayout(layout))
        markSaved()
    }

    function saveDashboardContentLayout(layout) {
        setPref('dashboard.contentLayout', normalizeDashboardContentLayout(layout))
        markSaved()
    }

    function saveDashboardRightOrder(order) {
        setPref('dashboard.rightOrder', normalizeDashboardRightOrder(order, dashboardContentLayout, dashboardLayout))
        markSaved()
    }

    function saveActivityLayout(layout) {
        setPref('activity.layout', normalizeActivityLayout(layout))
        markSaved()
    }

    function toggleDashboardModule(id) {
        saveDashboardLayout(dashboardLayout.map(item => (
            item.id === id ? { ...item, enabled: !item.enabled } : item
        )))
    }

    function toggleDashboardRightItem(entry) {
        if (entry.type === 'content') {
            toggleDashboardContentModule('right', entry.item.id)
        } else {
            toggleDashboardModule(entry.item.id)
        }
    }

    function moveDashboardRightItem(key, direction) {
        const current = [...dashboardRightOrder]
        const index = current.indexOf(key)
        const nextIndex = index + direction

        if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return

        const [item] = current.splice(index, 1)
        current.splice(nextIndex, 0, item)
        saveDashboardRightOrder(current)
    }

    function toggleDashboardContentModule(columnKey, id) {
        const next = cloneDashboardContentLayout()
        const item = next[columnKey]?.find(module => module.id === id)

        if (!item) return

        item.enabled = !item.enabled
        saveDashboardContentLayout(next)
    }

    function moveDashboardContentModule(columnKey, id, direction) {
        const next = cloneDashboardContentLayout()
        if (moveColumnLayoutItem(next, columnKey, id, direction, dashboardAllowColumnChanges)) {
            saveDashboardContentLayout(next)
        }
    }

    function toggleActivityModule(columnKey, id) {
        const next = cloneActivityLayout()
        const item = next[columnKey]?.find(module => module.id === id)

        if (!item) return

        item.enabled = !item.enabled
        saveActivityLayout(next)
    }

    function moveActivityModule(columnKey, id, direction) {
        const next = cloneActivityLayout()
        if (moveColumnLayoutItem(next, columnKey, id, direction, activityAllowColumnChanges)) {
            saveActivityLayout(next)
        }
    }

    function moveColumnLayoutItem(layout, columnKey, id, direction, allowColumnChanges) {
        const column = layout[columnKey] ?? []
        const index = column.findIndex(module => module.id === id)

        if (index < 0) return false

        if (direction < 0) {
            if (index > 0) {
                const previous = column[index - 1]
                column[index - 1] = column[index]
                column[index] = previous
                return true
            }

            if (allowColumnChanges && columnKey === 'right') {
                const [item] = column.splice(index, 1)
                layout.left.push(item)
                return true
            }

            return false
        }

        if (index < column.length - 1) {
            const nextItem = column[index + 1]
            column[index + 1] = column[index]
            column[index] = nextItem
            return true
        }

        if (allowColumnChanges && columnKey === 'left') {
            const [item] = column.splice(index, 1)
            layout.right.unshift(item)
            return true
        }

        return false
    }

    function cloneActivityLayout() {
        return {
            left: activityLayout.left.map(item => ({ ...item })),
            right: activityLayout.right.map(item => ({ ...item })),
        }
    }

    function cloneDashboardContentLayout() {
        return {
            left: dashboardContentLayout.left.map(item => ({ ...item })),
            right: dashboardContentLayout.right.map(item => ({ ...item })),
        }
    }

    function canMoveColumnLayoutItem(layout, columnKey, index, direction, allowColumnChanges) {
        const column = layout[columnKey]

        if (!column?.[index]) return false
        if (direction < 0) return index > 0 || (allowColumnChanges && columnKey === 'right')

        return index < column.length - 1 || (allowColumnChanges && columnKey === 'left')
    }

    function canMoveDashboardContentModule(columnKey, index, direction) {
        return canMoveColumnLayoutItem(
            dashboardContentLayout,
            columnKey,
            index,
            direction,
            dashboardAllowColumnChanges
        )
    }

    function canMoveActivityModule(columnKey, index, direction) {
        return canMoveColumnLayoutItem(
            activityLayout,
            columnKey,
            index,
            direction,
            activityAllowColumnChanges
        )
    }

    function resetDashboardControls() {
        setPref('dashboard.layout', normalizeDashboardLayout(DEFAULT_DASHBOARD_LAYOUT))
        setPref('dashboard.contentLayout', normalizeDashboardContentLayout(DEFAULT_DASHBOARD_CONTENT_LAYOUT))
        setPref('dashboard.rightOrder', defaultDashboardRightOrder)
        markSaved()
    }

    function resetActivityLayout() {
        setPref('activity.layout', normalizeActivityLayout(DEFAULT_ACTIVITY_LAYOUT))
        markSaved()
    }
</script>

<section class="panel panel-lg">
    <div class="panel-heading-row">
        <h2 class="panel-heading">Content Layout</h2>
        <div class="heading-actions">
            {#if prefsSaved}
                <span class="status ok prefs-saved"><i class="fa-solid fa-circle-check"></i> Saved</span>
            {/if}
        </div>
    </div>

    <div class="layout-section">
        <div class="section-heading-row">
            <div class="section-title">
                <i class="fa-solid fa-table-columns"></i>
                Dashboard Content
            </div>
            {#if !dashboardControlsAreDefault}
                <button type="button" class="reset-btn" onclick={resetDashboardControls}>
                    <i class="fa-solid fa-rotate-left"></i>
                    Reset to Default
                </button>
            {/if}
        </div>
        <p class="section-desc">
            Choose which dashboard content appears and reorder each column. Dashboard items stay in their assigned column.
        </p>
        <div class="layout-columns">
            {#each [['left', 'Left Column'], ['right', 'Right Column']] as [columnKey, label]}
                <div class="layout-column">
                    <div class="layout-column-title">{label}</div>
                    <div class="layout-list" role="list">
                        {#if columnKey === 'left'}
                            {#each dashboardContentLayout.left as item, index (item.id)}
                                <div
                                    class="layout-item-wrap"
                                    animate:flip={{ duration: 180 }}
                                >
                                    <div
                                        class:disabled={!item.enabled}
                                        class="layout-row"
                                        role="listitem"
                                    >
                                        <div class="module-name">{dashboardContentModuleLabel(item.id)}</div>
                                        <button
                                            type="button"
                                            class="toggle {item.enabled ? 'on' : ''}"
                                            onclick={() => toggleDashboardContentModule('left', item.id)}
                                            role="switch"
                                            aria-checked={item.enabled}
                                            aria-label={`Toggle ${dashboardContentModuleLabel(item.id)}`}
                                        ><div class="toggle-thumb"></div></button>
                                        <div class="reorder-controls">
                                            <button
                                                type="button"
                                                class="reorder-btn"
                                                disabled={!canMoveDashboardContentModule('left', index, -1)}
                                                onclick={() => moveDashboardContentModule('left', item.id, -1)}
                                                aria-label={`Move ${dashboardContentModuleLabel(item.id)} up`}
                                            ><i class="fa-solid fa-chevron-up"></i></button>
                                            <button
                                                type="button"
                                                class="reorder-btn"
                                                disabled={!canMoveDashboardContentModule('left', index, 1)}
                                                onclick={() => moveDashboardContentModule('left', item.id, 1)}
                                                aria-label={`Move ${dashboardContentModuleLabel(item.id)} down`}
                                            ><i class="fa-solid fa-chevron-down"></i></button>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <div class="empty-note">No dashboard content is assigned to this column.</div>
                            {/each}
                        {:else}
                            {#each dashboardRightItems as entry, index (entry.key)}
                                <div
                                    class="layout-item-wrap"
                                    animate:flip={{ duration: 180 }}
                                >
                                    <div
                                        class:disabled={!entry.item.enabled}
                                        class="layout-row"
                                        role="listitem"
                                    >
                                        <div class="module-name">
                                            {entry.type === 'content'
                                                ? dashboardContentModuleLabel(entry.item.id)
                                                : dashboardModuleLabel(entry.item.id)}
                                        </div>
                                        <button
                                            type="button"
                                            class="toggle {entry.item.enabled ? 'on' : ''}"
                                            onclick={() => toggleDashboardRightItem(entry)}
                                            role="switch"
                                            aria-checked={entry.item.enabled}
                                            aria-label={`Toggle ${entry.type === 'content'
                                                ? dashboardContentModuleLabel(entry.item.id)
                                                : dashboardModuleLabel(entry.item.id)}`}
                                        ><div class="toggle-thumb"></div></button>
                                        <div class="reorder-controls">
                                            <button
                                                type="button"
                                                class="reorder-btn"
                                                disabled={index === 0}
                                                onclick={() => moveDashboardRightItem(entry.key, -1)}
                                                aria-label={`Move ${entry.type === 'content'
                                                    ? dashboardContentModuleLabel(entry.item.id)
                                                    : dashboardModuleLabel(entry.item.id)} up`}
                                            ><i class="fa-solid fa-chevron-up"></i></button>
                                            <button
                                                type="button"
                                                class="reorder-btn"
                                                disabled={index === dashboardRightItems.length - 1}
                                                onclick={() => moveDashboardRightItem(entry.key, 1)}
                                                aria-label={`Move ${entry.type === 'content'
                                                    ? dashboardContentModuleLabel(entry.item.id)
                                                    : dashboardModuleLabel(entry.item.id)} down`}
                                            ><i class="fa-solid fa-chevron-down"></i></button>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <div class="empty-note">No dashboard content is assigned to this column.</div>
                            {/each}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <div class="layout-section">
        <div class="section-heading-row">
            <div class="section-title">
                <i class="fa-solid fa-layer-group"></i>
                Activity Content
            </div>
            {#if !activityIsDefault}
                <button type="button" class="reset-btn" onclick={resetActivityLayout}>
                    <i class="fa-solid fa-rotate-left"></i>
                    Reset to Default
                </button>
            {/if}
        </div>
        <p class="section-desc">
            Choose which activity modules appear and use the arrows to move items within or between columns.
        </p>
        <div class="layout-columns">
            {#each [['left', 'Left Column'], ['right', 'Right Column']] as [columnKey, label]}
                <div class="layout-column">
                    <div class="layout-column-title">{label}</div>
                    <div class="layout-list" role="list">
                        {#each activityLayout[columnKey] as item, index (item.id)}
                            <div
                                class="layout-item-wrap"
                                animate:flip={{ duration: 180 }}
                            >
                                <div
                                    class:disabled={!item.enabled}
                                    class="layout-row"
                                    role="listitem"
                                >
                                    <div class="module-name">{activityModuleLabel(item.id)}</div>
                                    <button
                                        type="button"
                                        class="toggle {item.enabled ? 'on' : ''}"
                                        onclick={() => toggleActivityModule(columnKey, item.id)}
                                        role="switch"
                                        aria-checked={item.enabled}
                                        aria-label={`Toggle ${activityModuleLabel(item.id)}`}
                                    ><div class="toggle-thumb"></div></button>
                                    <div class="reorder-controls">
                                        <button
                                            type="button"
                                            class="reorder-btn"
                                            disabled={!canMoveActivityModule(columnKey, index, -1)}
                                            onclick={() => moveActivityModule(columnKey, item.id, -1)}
                                            aria-label={`Move ${activityModuleLabel(item.id)} up`}
                                        ><i class="fa-solid fa-chevron-up"></i></button>
                                        <button
                                            type="button"
                                            class="reorder-btn"
                                            disabled={!canMoveActivityModule(columnKey, index, 1)}
                                            onclick={() => moveActivityModule(columnKey, item.id, 1)}
                                            aria-label={`Move ${activityModuleLabel(item.id)} down`}
                                        ><i class="fa-solid fa-chevron-down"></i></button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>

<style>
    .panel-heading-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    .heading-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-shrink: 0;
    }

    .section-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .reset-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.7rem;
        border-radius: 0.55rem;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        color: inherit;
        font-size: 0.76rem;
        font-weight: 700;
        opacity: 0.72;
        cursor: pointer;
        transition: background 120ms, opacity 120ms;
    }

    .reset-btn:hover {
        background: var(--l2);
        opacity: 1;
    }

    .layout-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 1.4rem;
        border-top: 1pt solid var(--l2);
    }

    .layout-section:first-of-type {
        border-top: none;
        padding-top: 0;
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 700;
    }

    .section-desc {
        font-size: 0.82rem;
        opacity: 0.6;
        line-height: 1.55;
        margin: 0;
    }

    .layout-list {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .layout-item-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .layout-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 0.8rem;
        padding: 0.65rem 0.75rem;
        border-radius: 0.75rem;
        background: hsl(212, 24%, 12%, 0.42);
        outline: solid 1pt hsl(212, 38%, 36%, 0.42);
        box-shadow: inset 0 1px 0 hsl(0, 0%, 100%, 0.045);
        backdrop-filter: blur(18px) saturate(1.18);
        -webkit-backdrop-filter: blur(18px) saturate(1.18);
        transition: opacity 180ms ease, background 180ms ease, outline-color 180ms ease;
    }

    .layout-row.disabled {
        opacity: 0.46;
        background: hsl(212, 16%, 10%, 0.3);
        outline-color: hsl(212, 22%, 28%, 0.3);
    }

    .module-name {
        min-width: 0;
        font-size: 0.9rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .layout-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.8rem;
        align-items: start;
    }

    .layout-column {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        min-width: 0;
    }

    .layout-column-title {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.52;
    }

    .empty-note {
        padding: 0.7rem 0.75rem;
        border-radius: 0.75rem;
        background: hsl(212, 16%, 10%, 0.24);
        outline: solid 1pt hsl(212, 22%, 28%, 0.24);
        font-size: 0.78rem;
        line-height: 1.35;
        opacity: 0.42;
    }

    .reorder-controls {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--contrast);
    }

    .reorder-btn {
        width: 1.75rem;
        height: 1.75rem;
        display: grid;
        place-items: center;
        border-radius: 0.45rem;
        color: inherit;
        opacity: 0.45;
        cursor: pointer;
    }

    .reorder-btn:hover:not(:disabled) {
        background: var(--l2);
        opacity: 0.9;
    }

    .reorder-btn:disabled {
        cursor: default;
        opacity: 0.16;
    }

    .toggle {
        width: 2.8rem;
        height: 1.55rem;
        border-radius: 100vh;
        background: var(--l3);
        outline: solid 1pt var(--l4);
        cursor: pointer;
        position: relative;
        transition: background 200ms, outline-color 200ms;
        flex-shrink: 0;
    }

    .toggle.on {
        background: var(--accent);
        outline-color: var(--bright-accent);
    }

    .toggle-thumb {
        position: absolute;
        top: 50%;
        left: 0.2rem;
        transform: translateY(-50%);
        width: 1.15rem;
        height: 1.15rem;
        border-radius: 50%;
        background: white;
        transition: left 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 1px 4px hsl(0, 0%, 0%, 0.3);
    }

    .toggle.on .toggle-thumb {
        left: calc(100% - 1.35rem);
    }

    @media (max-width: 640px) {
        .panel-heading-row {
            flex-direction: column;
        }

        .heading-actions {
            width: 100%;
            justify-content: space-between;
        }

        .section-heading-row {
            align-items: flex-start;
            flex-direction: column;
        }

        .layout-columns {
            grid-template-columns: minmax(0, 1fr);
        }

        .layout-row {
            grid-template-columns: minmax(0, 1fr) auto;
        }

        .reorder-controls {
            grid-column: 1 / -1;
            justify-content: flex-end;
        }
    }
</style>
