<script>
    import { db } from '$lib/data'

    const MIN_FRIENDS = 8

    let friends = $derived($db?.cache?.friends?.data ?? [])
    let show    = $derived(friends.length >= MIN_FRIENDS)

    let buckets = $derived(() => {
        const nowSecs = Math.floor(Date.now() / 1000)
        const active  = friends.filter(f => f.gameid || f.personastate > 0)
        const offline = friends.filter(f => !f.gameid && f.personastate === 0)

        let today = 0, week = 0, older = 0
        for (const f of offline) {
            if (!f.lastlogoff) { older++; continue }
            const age = nowSecs - f.lastlogoff
            if (age < 86400)       today++
            else if (age < 604800) week++
            else                   older++
        }

        const total = friends.length || 1
        return [
            { label: 'Online now', count: active.length, pct: Math.round((active.length / total) * 100), color: 'var(--bright-accent)' },
            { label: 'Today',      count: today,          pct: Math.round((today          / total) * 100), color: 'hsl(130 55% 50%)' },
            { label: 'This week',  count: week,           pct: Math.round((week           / total) * 100), color: 'hsl(212 40% 55%)' },
            { label: 'Older',      count: older,          pct: Math.round((older          / total) * 100), color: 'var(--l5)' },
        ]
    })
</script>

{#if show}
<div class="panel">
    <div class="panel-title">
        <i class="fa-solid fa-clock"></i>
        Last Seen
    </div>

    <div class="recency-list">
        {#each buckets() as b}
            <div class="rec-row">
                <div class="rec-dot" style="background:{b.color}"></div>
                <div class="rec-label">{b.label}</div>
                <div class="rec-track">
                    <div class="rec-bar" style="width:{b.pct}%; background:{b.color}"></div>
                </div>
                <div class="rec-count">{b.count}</div>
            </div>
        {/each}
    </div>

    <div class="rec-footer">{friends.length} friends total</div>
</div>
{/if}

<style>
    .recency-list { display: flex; flex-direction: column; gap: 0.6rem; }

    .rec-row {
        display: grid;
        grid-template-columns: 0.55rem 5.5rem 1fr 1.5rem;
        gap: 0.6rem;
        align-items: center;
    }

    .rec-dot {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .rec-label {
        font-size: 0.82rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .rec-track {
        height: 5px;
        background: var(--l2);
        border-radius: 100vh;
        overflow: hidden;
    }

    .rec-bar {
        height: 100%;
        border-radius: 100vh;
        opacity: 0.75;
        transition: width 600ms ease;
    }

    .rec-count {
        font-size: 0.8rem;
        font-weight: 700;
        opacity: 0.6;
        text-align: right;
    }

    .rec-footer {
        font-size: 0.7rem;
        opacity: 0.35;
        text-align: center;
        margin-top: 0.1rem;
    }
</style>
