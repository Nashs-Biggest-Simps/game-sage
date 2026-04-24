/**
 * @param {string | number | null | undefined} appid
 */
export function getSteamCapsuleCandidates(appid) {
    if (!appid) return []
    return [
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`,
    ]
}

/**
 * @param {string | number | null | undefined} appid
 */
export function getSteamHeroCandidates(appid) {
    if (!appid) return []
    return [
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_hero.jpg`,
        ...getSteamCapsuleCandidates(appid),
    ]
}

/**
 * @param {{ steam_appid?: string | number, header_image?: string | null, thumbnail?: string | null } | null | undefined} game
 * @param {'capsule' | 'hero'} [mode]
 */
export function getGameImageCandidates(game, mode = 'capsule') {
    if (!game) return []

    const custom = [game.thumbnail, game.header_image].filter(Boolean)
    const fallback = mode === 'hero'
        ? getSteamHeroCandidates(game.steam_appid)
        : getSteamCapsuleCandidates(game.steam_appid)

    return [...new Set([...custom, ...fallback])]
}

/**
 * @param {number} minutes
 */
export function formatPlaytime(minutes) {
    const hours = Math.round((minutes ?? 0) / 60)
    if (hours <= 0) return 'Unplayed'
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k h`
    return `${hours.toLocaleString()}h`
}

/**
 * @param {number} minutes
 */
export function getHourCount(minutes) {
    return Math.round((minutes ?? 0) / 60)
}

/**
 * @param {Array<{ description?: string }> | undefined | null} genres
 */
export function getGenreNames(genres) {
    return (genres ?? []).map((genre) => genre.description).filter(Boolean)
}

/**
 * @param {string | number | null | undefined} appid
 */
export function makeStoreThumbnail(appid) {
    return getSteamCapsuleCandidates(appid)[0] ?? null
}
