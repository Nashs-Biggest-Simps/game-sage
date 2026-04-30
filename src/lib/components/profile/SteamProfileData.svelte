<script>
    let {
        steamUser = null,
        savedID = '',
        connection = {},
        steamVisibility = '—',
        lastLogoff = null,
        friendsStatus = null,
        onRefresh = () => {},
    } = $props()
</script>

<section class="panel hero-panel">
    <div class="steam-hero">
        {#if steamUser}
            <img class="steam-avatar-lg" src={steamUser.avatarfull} alt="" />
        {:else}
            <div class="steam-avatar-lg steam-avatar-fallback">
                <i class="fa-brands fa-steam"></i>
            </div>
        {/if}

        <div class="steam-hero-info">
            <div class="steam-name">{steamUser?.personaname ?? 'Steam Profile'}</div>
            <div class="steam-realname">
                {steamUser?.realname ?? (savedID ? `Steam ID ${savedID}` : 'Connect your Steam account')}
            </div>

            <div class="steam-pills">
                <span class="spill {connection.type}">
                    <i class="fa-solid fa-{connection.icon}"></i>
                    {connection.title}
                </span>
                {#if steamUser}
                    <span class="spill">
                        <i class="fa-solid fa-shield"></i>
                        {steamVisibility}
                    </span>
                {/if}
                {#if steamUser?.loccountrycode}
                    <span class="spill">
                        <i class="fa-solid fa-location-dot"></i>
                        {steamUser.loccountrycode}
                    </span>
                {/if}
                {#if lastLogoff}
                    <span class="spill dim">
                        <i class="fa-solid fa-clock"></i>
                        Last seen {lastLogoff}
                    </span>
                {/if}
            </div>
        </div>

        <div class="steam-actions">
            {#if steamUser?.profileurl}
                <a class="steam-profile-link" href={steamUser.profileurl} target="_blank" rel="noopener">
                    <i class="fa-brands fa-steam"></i>
                    View Profile
                </a>
            {/if}
            <button class="btn-ghost compact" onclick={onRefresh}>Recheck</button>
        </div>
    </div>

    <div class="connection-copy {connection.type}">
        <i class="fa-solid fa-{connection.icon}"></i>
        <span>{connection.message}</span>
    </div>

    {#if friendsStatus?.state === 'private'}
        <p class="mini-warning">
            <i class="fa-solid fa-user-lock"></i>
            {friendsStatus.message}
        </p>
    {/if}
</section>

<style>
    .panel {
        background: hsl(212, 24%, 12%, 0.58);
        border-radius: 1.2rem;
        outline: solid 1pt hsl(212, 38%, 36%, 0.52);
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        backdrop-filter: blur(26px) saturate(1.24);
        -webkit-backdrop-filter: blur(26px) saturate(1.24);
        box-shadow: 0 18px 52px hsl(0, 0%, 0%, 0.24), inset 0 1px 0 hsl(0, 0%, 100%, 0.05);
    }

    .steam-hero {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 1.2rem;
        align-items: start;
    }

    .steam-avatar-lg {
        width: 5rem;
        height: 5rem;
        border-radius: 0.65rem;
        object-fit: cover;
        outline: 2px solid var(--la3);
    }

    .steam-avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(212, 28%, 18%, 0.72);
        color: hsl(188, 80%, 72%);
        font-size: 1.7rem;
    }

    .steam-hero-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .steam-name {
        min-width: 0;
        font-size: 1.4rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .steam-realname {
        min-width: 0;
        font-size: 0.85rem;
        opacity: 0.5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .steam-pills,
    .steam-actions {
        display: flex;
        align-items: center;
        gap: 0.42rem;
        flex-wrap: wrap;
    }

    .steam-actions { grid-column: 1 / -1; gap: 0.55rem; }

    .spill {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.22rem 0.65rem;
        background: var(--l1);
        border-radius: 100vh;
        outline: solid 1pt var(--l3);
        font-size: 0.73rem;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        max-width: 100%;
    }

    .spill i { flex-shrink: 0; font-size: 0.65rem; }
    .spill.dim { opacity: 0.5; }
    .spill.ok { background: hsl(146, 52%, 22%, 0.48); color: hsl(146, 72%, 70%); outline-color: hsl(146, 48%, 40%, 0.5); }
    .spill.warn, .spill.info { color: hsl(188, 80%, 72%); }
    .spill.danger { background: hsl(0, 50%, 18%, 0.54); color: hsl(0, 70%, 68%); outline-color: hsl(0, 50%, 32%, 0.72); }

    .steam-profile-link,
    .btn-ghost {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        border-radius: 0.6rem;
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
    }

    .steam-profile-link {
        padding: 0.5rem 1rem;
        background: var(--la1);
        outline: solid 1pt var(--la3);
        color: var(--bright-accent);
    }

    .steam-profile-link:hover { background: var(--la2); }

    .btn-ghost {
        padding: 0.5rem 1rem;
        background: var(--l2);
        color: inherit;
        outline: solid 1pt var(--l3);
    }

    .btn-ghost:hover { background: var(--l3); }

    .connection-copy {
        display: flex;
        align-items: flex-start;
        gap: 0.55rem;
        padding: 0.8rem 0.9rem;
        border-radius: 0.8rem;
        background: hsl(212, 24%, 10%, 0.44);
        outline: solid 1pt hsl(212, 38%, 36%, 0.4);
        color: hsl(212, 18%, 84%, 0.62);
        font-size: 0.82rem;
        line-height: 1.5;
    }

    .connection-copy i { margin-top: 0.22rem; flex-shrink: 0; }
    .connection-copy.ok { color: hsl(146, 72%, 72%, 0.82); outline-color: hsl(146, 48%, 40%, 0.35); }
    .connection-copy.danger { color: hsl(0, 70%, 72%, 0.86); outline-color: hsl(0, 50%, 32%, 0.5); }

    .mini-warning {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: hsl(38, 80%, 68%);
        font-size: 0.78rem;
        line-height: 1.45;
    }

    @media (max-width: 640px) {
        .panel { padding: 1.1rem; }
        .steam-hero { grid-template-columns: minmax(0, 1fr); gap: 0.9rem; }
        .steam-avatar-lg { width: 4.2rem; height: 4.2rem; }
        .steam-actions,
        .steam-profile-link,
        .btn-ghost { width: 100%; }
    }
</style>
