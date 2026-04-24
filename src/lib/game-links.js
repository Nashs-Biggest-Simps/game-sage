/**
 * @param {string | number | null | undefined} appid
 */
export function getGamePath(appid) {
    return `/view/${appid}`
}

/**
 * @param {string | number | null | undefined} appid
 */
export function getSteamRunUrl(appid) {
    return `steam://run/${appid}`
}

/**
 * @param {string | number | null | undefined} appid
 */
export function getSteamStoreUrl(appid) {
    return `https://store.steampowered.com/app/${appid}`
}

/**
 * @param {string | number | null | undefined} appid
 */
export function launchSteamGame(appid) {
    if (typeof window === 'undefined') return
    window.location.href = getSteamRunUrl(appid)
}
