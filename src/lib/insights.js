import { getGenreNames, getHourCount } from '$lib/steam-media'

/**
 * @param {Record<string, number>} playtime
 */
export function getTotalMinutes(playtime = {}) {
    return Object.values(playtime).reduce((total, minutes) => total + (minutes ?? 0), 0)
}

/**
 * @param {Record<string, number>} playtime
 */
export function getPlayedCount(playtime = {}) {
    return Object.values(playtime).filter((minutes) => (minutes ?? 0) > 0).length
}

/**
 * @param {Record<string, number>} playtime
 */
export function getUnplayedCount(playtime = {}) {
    return Object.values(playtime).filter((minutes) => (minutes ?? 0) === 0).length
}

/**
 * @param {Record<string, number>} playtime
 * @param {Record<string, { data?: { name?: string, genres?: Array<{ description?: string }> } }>} details
 * @param {number} [limit]
 */
export function getTopPlayedGames(playtime = {}, details = {}, limit = 5) {
    return Object.entries(playtime)
        .filter(([appid, minutes]) => (minutes ?? 0) > 0 && details[appid]?.data)
        .sort(([, left], [, right]) => right - left)
        .slice(0, limit)
        .map(([appid, minutes]) => ({
            appid: Number(appid),
            hours: getHourCount(minutes),
            detail: details[appid].data,
        }))
}

/**
 * @param {Record<string, number>} playtime
 * @param {Record<string, { data?: { genres?: Array<{ description?: string }> } }>} details
 * @param {number} [limit]
 */
export function getTopGenres(playtime = {}, details = {}, limit = 4) {
    const scores = new Map()

    for (const [appid, minutes] of Object.entries(playtime)) {
        if ((minutes ?? 0) <= 0 || !details[appid]?.data) continue

        for (const genre of getGenreNames(details[appid].data.genres)) {
            scores.set(genre, (scores.get(genre) ?? 0) + minutes)
        }
    }

    return [...scores.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .map(([genre, minutes]) => ({
            genre,
            hours: getHourCount(minutes),
        }))
}

/**
 * @param {Array<{ appid: number, name?: string, playtime_2weeks?: number, playtime_forever?: number }>} recentGames
 * @param {Record<string, { data?: { genres?: Array<{ description?: string }> } }>} details
 */
export function getRecentSummaries(recentGames = [], details = {}) {
    return recentGames.map((game) => ({
        ...game,
        hoursThisWeek: getHourCount(game.playtime_2weeks ?? 0),
        totalHours: getHourCount(game.playtime_forever ?? 0),
        genres: getGenreNames(details[game.appid]?.data?.genres).slice(0, 2),
    }))
}

/**
 * @param {Array<{ personastate?: number, gameid?: string | number }>} friends
 */
export function getFriendBuckets(friends = []) {
    const inGame = friends.filter((friend) => !!friend.gameid)
    const online = friends.filter((friend) => !friend.gameid && (friend.personastate ?? 0) > 0)
    const offline = friends.filter((friend) => !friend.gameid && (friend.personastate ?? 0) === 0)

    return { inGame, online, offline }
}

/**
 * @param {Array<{ gameid?: string | number, gameextrainfo?: string, personaname?: string, avatarmedium?: string }>} friends
 */
export function getPopularFriendGames(friends = []) {
    const map = new Map()

    for (const friend of friends) {
        if (!friend.gameid) continue
        const key = String(friend.gameid)
        const entry = map.get(key) ?? {
            appid: Number(friend.gameid),
            name: friend.gameextrainfo ?? `App ${friend.gameid}`,
            friends: [],
        }
        entry.friends.push(friend)
        map.set(key, entry)
    }

    return [...map.values()].sort((left, right) => right.friends.length - left.friends.length)
}
