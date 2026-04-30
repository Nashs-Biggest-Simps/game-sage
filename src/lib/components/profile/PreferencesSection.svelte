<script>
    import { db } from '$lib/data'

    const GENRES = [
        'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports',
        'Racing', 'Puzzle', 'Horror', 'Indie', 'Casual', 'Multiplayer',
        'Story Rich', 'Open World', 'Shooter', 'Platformer', 'Stealth',
        'Survival', 'Tower Defense', 'Visual Novel',
    ]

    let preferredGenres = $derived($db?.prefs?.genres?.preferred ?? [])
    let excludedGenres  = $derived($db?.prefs?.genres?.excluded  ?? [])
    let refreshHours    = $derived($db?.prefs?.suggestions?.refreshHours ?? 24)
    let aiTone          = $derived($db?.prefs?.suggestions?.aiTone ?? 'brief')
    let maxResults      = $derived($db?.prefs?.suggestions?.maxResults ?? 10)
    let compactLibrary  = $derived($db?.prefs?.display?.compactLibrary ?? false)
    let defaultSort     = $derived($db?.prefs?.library?.defaultSort ?? 'None')
    let defaultFilter   = $derived($db?.prefs?.library?.defaultFilter ?? 'All')
    let prefsSaved      = $state(false)

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

    function invalidateSuggestions() {
        db.update(data => {
            const cache = structuredClone(data.cache ?? {})
            const s = cache?.suggestions
            if (s?.play) s.play.generatedAt = 0
            if (s?.buy) s.buy.generatedAt = 0
            return { ...data, cache }
        })
    }

    function genreState(genre) {
        if (preferredGenres.includes(genre)) return 'preferred'
        if (excludedGenres.includes(genre)) return 'excluded'
        return 'neutral'
    }

    function markSaved() {
        prefsSaved = true
        setTimeout(() => prefsSaved = false, 2000)
    }

    function cycleGenre(genre) {
        db.update(data => {
            const prefs = structuredClone(data.prefs ?? {})
            prefs.genres ??= { preferred: [], excluded: [] }
            const preferred = new Set(prefs.genres.preferred ?? [])
            const excluded = new Set(prefs.genres.excluded ?? [])

            if (!preferred.has(genre) && !excluded.has(genre)) {
                preferred.add(genre)
            } else if (preferred.has(genre)) {
                preferred.delete(genre)
                excluded.add(genre)
            } else {
                excluded.delete(genre)
            }

            prefs.genres.preferred = [...preferred]
            prefs.genres.excluded = [...excluded]

            const cache = structuredClone(data.cache ?? {})
            const s = cache?.suggestions
            if (s?.play) s.play.generatedAt = 0
            if (s?.buy) s.buy.generatedAt = 0

            return { ...data, prefs, cache }
        })
        markSaved()
    }

    function savePref(path, value) {
        setPref(path, value)
        invalidateSuggestions()
        markSaved()
    }
</script>

<section class="panel">
    <h2 class="panel-heading">Preferences</h2>

    <div class="pref-section">
        <div class="pref-section-title">
            <i class="fa-solid fa-tags"></i>
            Genre Preferences
        </div>
        <p class="pref-section-desc">
            Shapes your AI recommendations in real-time. Click once to prefer
            <span class="chip-demo preferred">Action</span>,
            again to exclude <span class="chip-demo excluded">Sports</span>, again to clear.
        </p>
        <div class="genre-chips">
            {#each GENRES as genre}
                {@const state = genreState(genre)}
                <button
                    class="gchip {state}"
                    onclick={() => cycleGenre(genre)}
                    title={state === 'preferred' ? 'Preferred — click to exclude' : state === 'excluded' ? 'Excluded — click to clear' : 'Click to prefer'}
                >
                    {#if state === 'preferred'}<i class="fa-solid fa-heart"></i>
                    {:else if state === 'excluded'}<i class="fa-solid fa-ban"></i>{/if}
                    {genre}
                </button>
            {/each}
        </div>
        {#if preferredGenres.length > 0 || excludedGenres.length > 0}
            <div class="pref-active-note">
                <i class="fa-solid fa-circle-check"></i>
                {preferredGenres.length > 0 ? `Preferring ${preferredGenres.length} genre${preferredGenres.length !== 1 ? 's' : ''}` : ''}
                {preferredGenres.length > 0 && excludedGenres.length > 0 ? ' · ' : ''}
                {excludedGenres.length > 0 ? `Excluding ${excludedGenres.length} genre${excludedGenres.length !== 1 ? 's' : ''}` : ''}
                &nbsp;— dashboard suggestions will regenerate with these preferences.
            </div>
        {/if}
    </div>

    <div class="pref-section">
        <div class="pref-section-title">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            AI Suggestions
        </div>
        <div class="pref-row">
            <div class="pref-label-block">
                <div class="pref-label">Refresh Interval</div>
                <div class="pref-hint">How often GameSage regenerates your recommendations</div>
            </div>
            <div class="seg-btns">
                {#each [6, 12, 24, 48] as h}
                    <button class="seg-btn {refreshHours === h ? 'active' : ''}" onclick={() => savePref('suggestions.refreshHours', h)}>{h}h</button>
                {/each}
            </div>
        </div>
        <div class="pref-row">
            <div class="pref-label-block">
                <div class="pref-label">Suggestion Style</div>
                <div class="pref-hint">Tone used when explaining why a game was recommended</div>
            </div>
            <div class="seg-btns">
                {#each [['brief','Brief'], ['detailed','Detailed'], ['enthusiastic','Enthusiastic']] as [val, label]}
                    <button class="seg-btn {aiTone === val ? 'active' : ''}" onclick={() => savePref('suggestions.aiTone', val)}>{label}</button>
                {/each}
            </div>
        </div>
        <div class="pref-row">
            <div class="pref-label-block">
                <div class="pref-label">Results per Section</div>
                <div class="pref-hint">How many games to show in each suggestion row</div>
            </div>
            <div class="seg-btns">
                {#each [8, 10, 12] as n}
                    <button class="seg-btn {maxResults === n ? 'active' : ''}" onclick={() => savePref('suggestions.maxResults', n)}>{n}</button>
                {/each}
            </div>
        </div>
        {#if prefsSaved}
            <span class="status ok"><i class="fa-solid fa-circle-check"></i> Saved — suggestions update on next load</span>
        {/if}
    </div>

    <div class="pref-section">
        <div class="pref-section-title">
            <i class="fa-solid fa-grip"></i>
            Library Defaults
        </div>
        <div class="pref-row">
            <div class="pref-label-block">
                <div class="pref-label">Default Sort</div>
                <div class="pref-hint">How your library is sorted when you open it</div>
            </div>
            <div class="seg-btns">
                {#each [['None','Default'], ['Most Played','Most Played'], ['A → Z','A → Z']] as [val, label]}
                    <button class="seg-btn {defaultSort === val ? 'active' : ''}" onclick={() => { setPref('library.defaultSort', val); db.update(d => ({ ...d, filters: { ...d.filters, Sort: val } })) }}>{label}</button>
                {/each}
            </div>
        </div>
        <div class="pref-row">
            <div class="pref-label-block">
                <div class="pref-label">Default Display Filter</div>
                <div class="pref-hint">Which games are shown when you open the library</div>
            </div>
            <div class="seg-btns">
                {#each [['All','All Games'], ['Never Played','Unplayed Only']] as [val, label]}
                    <button class="seg-btn {defaultFilter === val ? 'active' : ''}" onclick={() => { setPref('library.defaultFilter', val); db.update(d => ({ ...d, filters: { ...d.filters, Display: val } })) }}>{label}</button>
                {/each}
            </div>
        </div>
        <div class="pref-toggle-row">
            <div class="pref-label-block">
                <div class="pref-label">Compact Library</div>
                <div class="pref-hint">Smaller cards to fit more games per row</div>
            </div>
            <button
                class="toggle {compactLibrary ? 'on' : ''}"
                onclick={() => setPref('display.compactLibrary', !compactLibrary)}
                role="switch"
                aria-checked={compactLibrary}
                aria-label="Compact library"
            ><div class="toggle-thumb"></div></button>
        </div>
    </div>
</section>

<style>
    .panel {
        background: hsl(212, 24%, 12%, 0.58);
        border-radius: 1.2rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.52);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        backdrop-filter: blur(26px) saturate(1.24);
        -webkit-backdrop-filter: blur(26px) saturate(1.24);
        box-shadow: 0 18px 52px hsl(0, 0%, 0%, 0.24), inset 0 1px 0 hsl(0, 0%, 100%, 0.05);
    }

    .panel-heading { font-size: 1.4rem; font-weight: 700; margin: 0; }
    .pref-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 1.4rem;
        border-top: 1pt solid var(--l2);
    }
    .pref-section:first-of-type { border-top: none; padding-top: 0; }
    .pref-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; }
    .pref-section-desc {
        font-size: 0.82rem;
        opacity: 0.6;
        line-height: 1.55;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
    }
    .chip-demo,
    .gchip {
        display: inline-flex;
        align-items: center;
        border-radius: 100vh;
        font-weight: 700;
    }
    .chip-demo { padding: 0.15rem 0.5rem; font-size: 0.72rem; }
    .chip-demo.preferred { background: var(--la1); color: var(--bright-accent); outline: solid 1pt var(--la3); }
    .chip-demo.excluded { background: hsl(0, 50%, 18%); color: hsl(0, 70%, 65%); outline: solid 1pt hsl(0, 50%, 30%); }
    .genre-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .gchip {
        gap: 0.3rem;
        padding: 0.35rem 0.75rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 120ms, outline-color 120ms, transform 80ms;
        background: var(--l1);
        outline: solid 1pt var(--l3);
        color: inherit;
        opacity: 0.7;
    }
    .gchip:hover { opacity: 1; transform: scale(1.04); }
    .gchip.preferred { background: var(--la1); outline-color: var(--la3); color: var(--bright-accent); opacity: 1; }
    .gchip.excluded { background: hsl(0, 50%, 18%); outline-color: hsl(0, 50%, 30%); color: hsl(0, 70%, 65%); opacity: 1; }
    .gchip i { font-size: 0.65rem; }
    .pref-active-note { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: hsl(130, 55%, 55%); flex-wrap: wrap; }
    .pref-active-note i { font-size: 0.72rem; flex-shrink: 0; }
    .pref-row,
    .pref-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
    }
    .pref-row { flex-wrap: wrap; }
    .pref-label-block { display: flex; flex-direction: column; gap: 0.2rem; }
    .pref-label { font-size: 0.88rem; font-weight: 600; }
    .pref-hint { font-size: 0.73rem; opacity: 0.5; }
    .seg-btns {
        display: flex;
        background: var(--l1);
        border-radius: 0.55rem;
        outline: solid 1pt var(--l3);
        padding: 0.2rem;
        gap: 0.15rem;
        flex-shrink: 0;
    }
    .seg-btn {
        padding: 0.4rem 0.85rem;
        border-radius: 0.38rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        color: inherit;
        opacity: 0.55;
    }
    .seg-btn:hover { opacity: 0.85; background: var(--l2); }
    .seg-btn.active { background: var(--la1); color: var(--bright-accent); opacity: 1; outline: solid 1pt var(--la3); }
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
    .toggle.on { background: var(--accent); outline-color: var(--bright-accent); }
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
    .toggle.on .toggle-thumb { left: calc(100% - 1.35rem); }
    .status { font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
    .status.ok { color: hsl(130, 55%, 55%); }

    @media (max-width: 640px) {
        .panel { padding: 1.25rem; }
        .pref-row,
        .pref-toggle-row {
            align-items: stretch;
            flex-direction: column;
        }
        .seg-btns {
            width: 100%;
            flex-wrap: wrap;
        }
    }
</style>
