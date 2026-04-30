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

<section class="panel panel-lg">
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
    .field-val.provider,
    .field-val.verified,
    .field-val.unverified { display: flex; align-items: center; gap: 0.4rem; }
    .field-val.verified { color: hsl(130, 55%, 60%); opacity: 1; }
    .field-val.unverified { color: hsl(0, 60%, 65%); opacity: 1; }
</style>
