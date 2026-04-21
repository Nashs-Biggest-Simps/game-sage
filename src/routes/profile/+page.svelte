<script>
    import { db, clearCache } from '$lib/data'
    import { auth } from '$lib/auth'
    import { startCacheUpdateCycle } from '$lib/cache'
    import { signOut } from 'firebase/auth'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'

    // ── Reactive state ───────────────────────────────────────────────────────

    let fireUser   = $derived($db?.user)
    let steamUser  = $derived($db?.cache?.user?.data ?? null)
    let savedID    = $derived($db?.steamID ?? '')

    let inputID    = $state('')
    let saveStatus = $state(null)   // null | 'saved' | 'error' | 'refreshed'
    let activeNav  = $state('account')

    $effect(() => { if (savedID && !inputID) inputID = savedID })

    // ── Avatar / name resolution ─────────────────────────────────────────────

    let avatar = $derived(
        steamUser?.avatarfull ??
        fireUser?.photoURL ??
        null
    )
    let displayName = $derived(
        steamUser?.personaname ??
        fireUser?.displayName ??
        'User'
    )
    let email = $derived(fireUser?.email ?? '')

    // ── Helpers ──────────────────────────────────────────────────────────────

    const ID_REGEX = /^\d{17}$/

    let isDirty   = $derived(inputID.trim() !== savedID)
    let isValid   = $derived(ID_REGEX.test(inputID.trim()))
    let willWipe  = $derived(isDirty && isValid)

    function saveChanges() {
        const trimmed = inputID.trim()
        if (!ID_REGEX.test(trimmed)) {
            saveStatus = 'error'
            setTimeout(() => saveStatus = null, 3000)
            return
        }
        const changed = trimmed !== savedID
        db.update(data => {
            if (changed) { data.cache = {}; data.algr = {}; data.user = {} }
            data.steamID = trimmed
            return data
        })
        if (changed) startCacheUpdateCycle()
        saveStatus = 'saved'
        setTimeout(() => saveStatus = null, 2500)
    }

    function resetChanges() {
        inputID = savedID
        saveStatus = null
    }

    function refreshLibrary() {
        clearCache()
        startCacheUpdateCycle()
        saveStatus = 'refreshed'
        setTimeout(() => saveStatus = null, 2500)
    }

    async function logout() {
        await signOut(auth)
        db.update(d => { d.user = {}; return d })
        goto(resolve('/login'))
    }

    const NAV = [
        { id: 'account',     label: 'Your Account', icon: 'user'     },
        { id: 'data',        label: 'Data & Cache',  icon: 'database' },
        { id: 'preferences', label: 'Preferences',   icon: 'sliders'  },
    ]
</script>

<div class="profile-page">

    <!-- ── Left Sidebar ───────────────────────────────────── -->
    <aside class="sidebar">
        <div class="identity">
            {#if avatar}
                <img class="avatar" src={avatar} alt="" />
            {:else}
                <div class="avatar-placeholder">
                    <i class="fa-solid fa-user"></i>
                </div>
            {/if}
            <div class="display-name">{displayName}</div>
            {#if email}<div class="email">{email}</div>{/if}
        </div>

        <nav class="sidebar-nav">
            {#each NAV as item}
                <button
                    class="nav-item {activeNav === item.id ? 'active' : ''}"
                    onclick={() => activeNav = item.id}
                >
                    <i class="fa-solid fa-{item.icon}"></i>
                    {item.label}
                </button>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <button class="nav-item danger" onclick={logout}>
                <i class="fa-solid fa-right-from-bracket"></i>
                Sign Out
            </button>
        </div>
    </aside>

    <!-- ── Main Content ───────────────────────────────────── -->
    <main class="main-content">

        {#if activeNav === 'account'}
        <section class="panel">
            <h2 class="panel-heading">Your Account</h2>

            <div class="form-grid">
                <div class="field">
                    <div class="field-label">Display Name</div>
                    <div class="field-val readonly">{displayName}</div>
                </div>

                <div class="field">
                    <label class="field-label" for="steam-id">
                        Steam ID
                        <span class="hint">17-digit number</span>
                    </label>
                    <input
                        id="steam-id"
                        class="field-val {saveStatus === 'error' ? 'err' : ''}"
                        type="text"
                        inputmode="numeric"
                        placeholder="76561198000000000"
                        maxlength="17"
                        bind:value={inputID}
                        onkeydown={(e) => e.key === 'Enter' && saveChanges()}
                    />
                </div>

                <div class="field">
                    <div class="field-label">Email</div>
                    <div class="field-val readonly">{email || '—'}</div>
                </div>

                <div class="field">
                    <div class="field-label">Steam Profile</div>
                    {#if steamUser?.profileurl}
                        <a class="field-val steam-link" href={steamUser.profileurl} target="_blank" rel="noopener">
                            {steamUser.personaname}
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    {:else if savedID}
                        <div class="field-val readonly muted">Loading…</div>
                    {:else}
                        <div class="field-val readonly muted">Enter a Steam ID to link your profile</div>
                    {/if}
                </div>
            </div>

            {#if isDirty && inputID.trim().length > 0 && !isValid}
                <p class="notice warn">Steam ID must be exactly 17 digits.</p>
            {:else if willWipe}
                <p class="notice info">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Changing your Steam ID will clear all cached library data.
                </p>
            {/if}

            <div class="btn-row">
                <button class="btn-primary" onclick={saveChanges}>
                    <i class="fa-solid fa-floppy-disk"></i>
                    Save Changes
                </button>
                <button class="btn-ghost" onclick={resetChanges}>Reset</button>

                {#if saveStatus === 'saved'}
                    <span class="status ok"><i class="fa-solid fa-circle-check"></i> Saved</span>
                {:else if saveStatus === 'error'}
                    <span class="status err-msg"><i class="fa-solid fa-circle-xmark"></i> Invalid Steam ID</span>
                {/if}
            </div>
        </section>

        {:else if activeNav === 'data'}
        <section class="panel">
            <h2 class="panel-heading">Data &amp; Cache</h2>
            <p class="panel-desc">GameSage stores your Steam library locally to speed up load times and reduce API usage. Use these controls to manage that data.</p>

            <div class="data-grid">
                <div class="data-card">
                    <div class="data-title">
                        <i class="fa-solid fa-rotate"></i>
                        Refresh Library
                    </div>
                    <p class="data-desc">Clear cached library data and re-fetch everything from Steam. Use this if your library has changed.</p>
                    <button class="btn-ghost" onclick={refreshLibrary}>Refresh Now</button>
                </div>
                <div class="data-card danger-card">
                    <div class="data-title">
                        <i class="fa-solid fa-trash"></i>
                        Clear All Cache
                    </div>
                    <p class="data-desc">Wipes all locally stored data including your library, suggestions, and AI feedback history.</p>
                    <button class="btn-danger" onclick={refreshLibrary}>Clear Cache</button>
                </div>
            </div>

            {#if saveStatus === 'refreshed'}
                <span class="status ok"><i class="fa-solid fa-circle-check"></i> Cache cleared — refreshing…</span>
            {/if}
        </section>

        {:else if activeNav === 'preferences'}
        <section class="panel">
            <h2 class="panel-heading">Preferences</h2>
            <p class="panel-desc muted">Preference settings coming soon.</p>
        </section>
        {/if}

    </main>
</div>

<style>
    .profile-page {
        display: grid;
        grid-template-columns: 15rem 1fr;
        gap: 2rem;
        align-items: start;
    }

    /* ── Sidebar ──────────────────────── */

    .sidebar {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        position: sticky;
        top: 2.4rem;
    }

    .identity {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.35rem;
        padding-bottom: 1.1rem;
        border-bottom: 1pt solid var(--l2);
        margin-bottom: 0.6rem;
    }

    .avatar {
        width: 4.5rem;
        height: 4.5rem;
        border-radius: 50%;
        object-fit: cover;
        outline: 3px solid var(--la3);
        margin-bottom: 0.3rem;
    }

    .avatar-placeholder {
        width: 4.5rem;
        height: 4.5rem;
        border-radius: 50%;
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        opacity: 0.35;
        margin-bottom: 0.3rem;
    }

    .display-name { font-size: 0.95rem; font-weight: 700; }
    .email        { font-size: 0.72rem; opacity: 0.45; }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        flex: 1;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.75rem;
        border-radius: 0.6rem;
        font-size: 0.86rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 120ms;
        width: 100%;
        text-align: left;
        color: inherit;
        opacity: 0.65;
    }

    .nav-item i { width: 1rem; text-align: center; font-size: 0.78rem; }

    .nav-item:hover  { background: var(--l1); opacity: 1; }
    .nav-item.active { background: var(--la1); color: var(--bright-accent); opacity: 1; outline: solid 1pt var(--la2); }
    .nav-item.danger { color: hsl(0, 60%, 65%); opacity: 0.75; }
    .nav-item.danger:hover { background: hsl(0, 50%, 18%, 0.5); opacity: 1; }

    .sidebar-footer {
        border-top: 1pt solid var(--l2);
        padding-top: 0.7rem;
        margin-top: 0.3rem;
    }

    /* ── Main ─────────────────────────── */

    .main-content { display: flex; flex-direction: column; gap: 1.4rem; }

    .panel {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
    }

    .panel-heading { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .panel-desc    { font-size: 0.86rem; opacity: 0.55; line-height: 1.6; margin: 0; }
    .panel-desc.muted { opacity: 0.35; font-style: italic; }

    /* ── Form ─────────────────────────── */

    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.1rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }

    .field-label {
        font-size: 0.76rem;
        font-weight: 600;
        opacity: 0.6;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .hint { font-size: 0.7rem; font-weight: 400; opacity: 0.7; text-transform: none; letter-spacing: 0; }

    .field-val {
        padding: 0.6rem 0.85rem;
        background: var(--l1);
        border-radius: 0.55rem;
        outline: solid 1pt var(--l3);
        font-size: 0.88rem;
        font-family: inherit;
        color: var(--contrast);
        transition: outline-color 150ms;
        box-sizing: border-box;
        width: 100%;
        display: block;
    }

    .field-val:focus     { outline-color: var(--accent); }
    .field-val.readonly  { opacity: 0.5; cursor: default; }
    .field-val.muted     { opacity: 0.35; font-style: italic; }
    .field-val.err       { outline-color: var(--warning); }

    .steam-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--bright-accent);
        cursor: pointer;
        opacity: 1;
    }
    .steam-link:hover { outline-color: var(--bright-accent); }
    .steam-link i     { font-size: 0.72rem; opacity: 0.6; }

    /* ── Notices ──────────────────────── */

    .notice {
        font-size: 0.8rem;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        line-height: 1.5;
    }

    .notice.warn { color: hsl(0, 60%, 65%); }
    .notice.info { color: hsl(38, 80%, 65%); }

    /* ── Buttons ──────────────────────── */

    .btn-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.4rem;
        background: var(--accent);
        border-radius: 0.55rem;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        color: white;
        transition: background 150ms;
    }
    .btn-primary:hover { background: var(--bright-accent); }

    .btn-ghost {
        padding: 0.6rem 1.2rem;
        background: var(--l2);
        border-radius: 0.55rem;
        font-size: 0.88rem;
        font-weight: 500;
        cursor: pointer;
        color: inherit;
        outline: solid 1pt var(--l3);
        transition: background 150ms;
    }
    .btn-ghost:hover { background: var(--l3); }

    .btn-danger {
        padding: 0.6rem 1.2rem;
        background: hsl(0, 50%, 18%, 0.6);
        border-radius: 0.55rem;
        font-size: 0.88rem;
        font-weight: 500;
        cursor: pointer;
        color: hsl(0, 60%, 70%);
        outline: solid 1pt hsl(0, 50%, 32%);
        transition: background 150ms;
    }
    .btn-danger:hover { background: hsl(0, 50%, 24%, 0.8); }

    .status {
        font-size: 0.82rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }
    .status.ok      { color: hsl(130, 55%, 55%); }
    .status.err-msg { color: hsl(0, 60%, 65%); }

    /* ── Data Cards ───────────────────── */

    .data-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

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

    .data-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.92rem;
        font-weight: 700;
    }

    .data-desc {
        font-size: 0.78rem;
        opacity: 0.5;
        line-height: 1.5;
        margin: 0;
        flex: 1;
    }
</style>
