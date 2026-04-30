<script>
    let {
        fireUser = null,
        googleAvatar = null,
        email = '',
        googleProvider = null,
        emailVerified = false,
        googleCreated = null,
        googleLastSign = null,
    } = $props()
</script>

<section class="panel">
    <h2 class="panel-heading">Google Account</h2>
    <div class="google-header">
        {#if googleAvatar}
            <img class="google-avatar" src={googleAvatar} alt="" />
        {:else}
            <div class="google-avatar-ph"><i class="fa-brands fa-google"></i></div>
        {/if}
        <div>
            <div class="google-name">{fireUser?.displayName ?? '—'}</div>
            <div class="google-email">{email}</div>
        </div>
    </div>
    <div class="form-grid">
        <div class="field">
            <div class="field-label">User ID</div>
            <div class="field-val readonly uid">{fireUser?.uid ?? '—'}</div>
        </div>
        <div class="field">
            <div class="field-label">Sign-in Provider</div>
            <div class="field-val readonly provider">
                {#if googleProvider === 'google.com'}
                    <i class="fa-brands fa-google"></i> Google
                {:else}
                    {googleProvider ?? '—'}
                {/if}
            </div>
        </div>
        <div class="field">
            <div class="field-label">Email Verified</div>
            <div class="field-val readonly {emailVerified ? 'verified' : 'unverified'}">
                {#if emailVerified}
                    <i class="fa-solid fa-circle-check"></i> Verified
                {:else}
                    <i class="fa-solid fa-circle-xmark"></i> Not Verified
                {/if}
            </div>
        </div>
        {#if googleCreated}
            <div class="field">
                <div class="field-label">Account Created</div>
                <div class="field-val readonly">{new Date(googleCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
        {/if}
        {#if googleLastSign}
            <div class="field">
                <div class="field-label">Last Sign-in</div>
                <div class="field-val readonly">{new Date(googleLastSign).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
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
    .google-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--l1);
        border-radius: 0.75rem;
        outline: solid 1pt var(--l3);
    }

    .google-avatar,
    .google-avatar-ph {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .google-avatar { object-fit: cover; }
    .google-avatar-ph {
        background: var(--l3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        opacity: 0.4;
    }

    .google-name { font-size: 0.95rem; font-weight: 700; }
    .google-email { font-size: 0.78rem; opacity: 0.5; margin-top: 0.1rem; }
    .form-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.72rem; font-weight: 700; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.05em; }
    .field-val {
        padding: 0.6rem 0.85rem;
        background: var(--l1);
        border-radius: 0.55rem;
        outline: solid 1pt var(--l3);
        font-size: 0.88rem;
        color: var(--contrast);
        box-sizing: border-box;
        width: 100%;
        display: block;
    }
    .field-val.readonly { opacity: 0.5; cursor: default; }
    .field-val.uid { font-family: monospace; font-size: 0.75rem; word-break: break-all; }
    .field-val.provider,
    .field-val.verified,
    .field-val.unverified { display: flex; align-items: center; gap: 0.4rem; }
    .field-val.verified { color: hsl(130, 55%, 60%); opacity: 1; }
    .field-val.unverified { color: hsl(0, 60%, 65%); opacity: 1; }

    @media (max-width: 640px) {
        .panel { padding: 1.25rem; }
    }
</style>
