<script>
    let {
        avatar = null,
        displayName = 'User',
        email = '',
        visibleNav = [],
        activeNav = $bindable('account'),
        onLogout,
    } = $props()
</script>

<aside class="sidebar">
    <div class="identity">
        {#if avatar}
            <img class="avatar" src={avatar} alt="" />
        {:else}
            <div class="avatar-placeholder"><i class="fa-solid fa-user"></i></div>
        {/if}
        <div class="display-name">{displayName}</div>
        {#if email}<div class="email">{email}</div>{/if}
    </div>

    <nav class="sidebar-nav">
        {#each visibleNav as item}
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
        <button class="nav-item danger" onclick={onLogout}>
            <i class="fa-solid fa-right-from-bracket"></i>
            Sign Out
        </button>
    </div>
</aside>

<style>
    .sidebar {
        background: var(--lb0);
        border-radius: 1.2rem;
        outline: solid 1pt var(--l3);
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        position: sticky;
        top: 2.4rem;
        width: max-content;
        min-width: 11rem;
    }

    .identity {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.3rem;
        padding-bottom: 1rem;
        border-bottom: 1pt solid var(--l2);
        margin-bottom: 0.5rem;
    }

    .avatar,
    .avatar-placeholder {
        width: 3.8rem;
        height: 3.8rem;
        border-radius: 50%;
        margin-bottom: 0.25rem;
    }

    .avatar {
        object-fit: cover;
        outline: 2px solid var(--la3);
    }

    .avatar-placeholder {
        background: var(--l2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        opacity: 0.35;
    }

    .display-name {
        font-size: 0.88rem;
        font-weight: 700;
        white-space: nowrap;
    }

    .email {
        max-width: 9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.68rem;
        opacity: 0.4;
    }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        flex: 1;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.5rem 0.7rem;
        border-radius: 0.55rem;
        font-size: 0.84rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 120ms;
        white-space: nowrap;
        color: inherit;
        opacity: 0.65;
        box-sizing: border-box;
    }

    .nav-item i {
        width: 0.9rem;
        text-align: center;
        font-size: 0.75rem;
        flex-shrink: 0;
    }

    .nav-item:hover {
        background: var(--l1);
        opacity: 1;
    }

    .nav-item.active {
        background: var(--la1);
        color: var(--bright-accent);
        opacity: 1;
        outline: solid 1pt var(--la2);
    }

    .nav-item.danger {
        color: hsl(0, 60%, 65%);
        opacity: 0.75;
    }

    .nav-item.danger:hover {
        background: hsl(0, 50%, 18%, 0.5);
        opacity: 1;
    }

    .sidebar-footer {
        border-top: 1pt solid var(--l2);
        padding-top: 0.7rem;
        margin-top: 0.3rem;
        width: 100%;
    }

    @media (max-width: 980px) {
        .sidebar {
            position: relative;
            top: auto;
            width: auto;
        }

        .sidebar-nav {
            flex-direction: row;
            flex-wrap: wrap;
        }

        .sidebar-footer {
            border-top: 0;
            padding-top: 0;
        }
    }
</style>
