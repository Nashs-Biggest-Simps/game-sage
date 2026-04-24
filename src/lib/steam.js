import { get } from 'svelte/store'
import { db } from '$lib/data'

function steamID() {
    return get(db)?.steamID ?? ''
}

async function makeApiCall(action, params = {}, callback) {
    const query = new URLSearchParams({
        action,
        ...params,
    })

    const response = await fetch(`/api?${query.toString()}`)
    const data = await response.json()

    if (!response.ok) {
        const message = data?.message ?? data?.error ?? `Request failed for ${action}`
        throw new Error(message)
    }

    if (callback) callback(data)
    return data
}

function withSteamID(params = {}) {
    return {
        steamid: steamID(),
        ...params,
    }
}

export const steamAPI = {
    getPlayerSummary: (callback) => makeApiCall('playerSummary', withSteamID(), callback),
    getPlayerSummaries: (steamids, callback) => makeApiCall('playerSummaries', {
        ids: Array.isArray(steamids) ? steamids.join(',') : steamids,
    }, callback),
    getFriendList: (callback) => makeApiCall('friendList', withSteamID(), callback),
    getPlayerBans: (callback) => makeApiCall('playerBans', withSteamID(), callback),

    getOwnedGames: (callback) => makeApiCall('ownedGames', withSteamID(), callback),
    getRecentlyPlayedGames: (callback) => makeApiCall('recentlyPlayed', withSteamID({ count: 6 }), callback),
    getSteamLevel: (callback) => makeApiCall('steamLevel', withSteamID(), callback),
    getBadges: (callback) => makeApiCall('badges', withSteamID(), callback),

    getPlayerAchievements: (appid, callback) => makeApiCall('playerAchievements', withSteamID({ appid }), callback),
    getUserStatsForGame: (appid, callback) => makeApiCall('userStatsForGame', withSteamID({ appid }), callback),
    getGameSchema: (appid, callback) => makeApiCall('gameSchema', { appid }, callback),
    getGlobalAchievementPercentages: (appid, callback) => makeApiCall('globalAchievementPercentages', { appid }, callback),

    getNewsForApp: (appid, callback) => makeApiCall('newsForApp', { appid }, callback),
    getGameDetails: (appid, callback) => makeApiCall('gameDetails', { appid }, callback),
    searchStore: (query, callback) => makeApiCall('searchStore', { query }, callback),
    howLongToBeat: (appid, callback) => makeApiCall('howLongToBeat', { appid }, callback),
    getFeaturedGames: (callback) => makeApiCall('featuredGames', {}, callback),
}
