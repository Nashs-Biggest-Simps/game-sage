<script>
    let {
        steamUser = null,
        savedID = '',
        inputID = $bindable(''),
        saveStatus = null,
        isDirty = false,
        isValid = false,
        willWipe = false,
        personaState = '—',
        accountCreated = null,
        accountAge = null,
        steamVisibility = '—',
        profileState = '—',
        lastLogoff = null,
        onSave = () => {},
        onReset = () => {},
    } = $props()
</script>

<section class="panel steam-account-panel">
    <h2 class="panel-heading">Steam Account</h2>

    <div class="form-grid">
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
                onkeydown={(e) => e.key === 'Enter' && onSave()}
            />
        </div>

        <div class="field">
            <div class="field-label">SteamID64</div>
            <div class="field-val readonly uid">{steamUser?.steamid ?? savedID ?? '—'}</div>
        </div>

        <div class="field">
            <div class="field-label">Steam Username</div>
            <div class="field-val readonly">{steamUser?.personaname ?? '—'}</div>
        </div>

        <div class="field">
            <div class="field-label">Current Status</div>
            <div class="field-val readonly">{personaState}</div>
        </div>

        {#if accountCreated}
            <div class="field">
                <div class="field-label">Account Created</div>
                <div class="field-val readonly">{accountCreated}</div>
            </div>
        {/if}

        {#if accountAge}
            <div class="field">
                <div class="field-label">Account Age</div>
                <div class="field-val readonly">{accountAge}</div>
            </div>
        {/if}

        {#if steamUser?.loccountrycode}
            <div class="field">
                <div class="field-label">Country</div>
                <div class="field-val readonly">{steamUser.loccountrycode}</div>
            </div>
        {/if}

        <div class="field">
            <div class="field-label">Profile Visibility</div>
            <div class="field-val readonly">{steamVisibility}</div>
        </div>

        <div class="field">
            <div class="field-label">Profile State</div>
            <div class="field-val readonly">{profileState}</div>
        </div>

        {#if lastLogoff}
            <div class="field">
                <div class="field-label">Last Seen</div>
                <div class="field-val readonly">{lastLogoff}</div>
            </div>
        {/if}

        <div class="field">
            <div class="field-label">Steam Profile</div>
            {#if steamUser?.profileurl}
                <a class="field-val steam-link" href={steamUser.profileurl} target="_blank" rel="noopener">
                    View on Steam
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            {:else if savedID}
                <div class="field-val readonly muted">Loading…</div>
            {:else}
                <div class="field-val readonly muted">Enter Steam ID above</div>
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
        <button class="btn-primary" onclick={onSave}>
            <i class="fa-solid fa-floppy-disk"></i>
            Save Changes
        </button>
        <button class="btn-ghost" onclick={onReset}>Reset</button>
        {#if saveStatus === 'saved'}
            <span class="status ok"><i class="fa-solid fa-circle-check"></i> Saved</span>
        {:else if saveStatus === 'error'}
            <span class="status err-msg"><i class="fa-solid fa-circle-xmark"></i> Invalid Steam ID</span>
        {/if}
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
    .form-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label {
        font-size: 0.72rem;
        font-weight: 700;
        opacity: 0.5;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
    .field-val:focus { outline-color: var(--accent); }
    .field-val.readonly { opacity: 0.5; cursor: default; }
    .field-val.muted { opacity: 0.35; font-style: italic; }
    .field-val.err { outline-color: var(--warning); }
    .field-val.uid { font-family: monospace; font-size: 0.75rem; word-break: break-all; }
    .steam-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--bright-accent);
        cursor: pointer;
        opacity: 1;
    }
    .steam-link:hover { outline-color: var(--bright-accent); }
    .steam-link i { font-size: 0.72rem; opacity: 0.6; }
    .notice { font-size: 0.8rem; margin: 0; display: flex; align-items: center; gap: 0.45rem; line-height: 1.5; }
    .notice.warn { color: hsl(0, 60%, 65%); }
    .notice.info { color: hsl(38, 80%, 65%); }
    .btn-row { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
    .btn-primary,
    .btn-ghost {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 0.55rem;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
    }
    .btn-primary { padding: 0.6rem 1.4rem; background: var(--accent); color: white; }
    .btn-primary:hover { background: var(--bright-accent); }
    .btn-ghost { padding: 0.6rem 1.2rem; background: var(--l2); color: inherit; outline: solid 1pt var(--l3); }
    .btn-ghost:hover { background: var(--l3); }
    .status { font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
    .status.ok { color: hsl(130, 55%, 55%); }
    .status.err-msg { color: hsl(0, 60%, 65%); }

    @media (max-width: 640px) {
        .panel { padding: 1.25rem; }
    }
</style>
