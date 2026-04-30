
// Steam API Call File

import { get } from 'svelte/store'
import { db } from '$lib/data'

const APIkey = "20C1F35B7542A2AA3770FBCA32674486"
const STEAM_ID_RE = /^\d{17}$/

function id() {
    return get(db)?.steamID ?? ''
}

export function isValidSteamId(value) {
    return STEAM_ID_RE.test(String(value ?? '').trim())
}

async function makeApiCall(url, callback, { requiresSteamId = false, label = 'Steam API' } = {}) {
    if (requiresSteamId && !isValidSteamId(id())) {
        console.warn(`[steam] Skipping ${label}: missing or invalid Steam ID`)
        if (callback) callback(null)
        return null
    }

    console.log("API Call Made:", url)
    try {
        const res = await fetch(`/api/steam-proxy?endpoint=${encodeURIComponent(url)}`)
        if (!res.ok) throw new Error(`${label} returned ${res.status}`)
        const data = await res.json()
        if (callback) callback(data)
        else return data
    } catch (err) {
        console.warn(`[steam] ${label} failed:`, err)
        if (callback) callback(null)
        return null
    }
}

export const steamAPI = {

    // --- ISteamUser ---
    getPlayerSummary: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${APIkey}&steamids=${id()}`, callback, { requiresSteamId: true, label: 'player summary' })
    },
    getPlayerSummaries: (steamids, callback) => {
        const ids = Array.isArray(steamids) ? steamids.join(',') : steamids
        if (!ids) {
            if (callback) callback(null)
            return
        }
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${APIkey}&steamids=${ids}`, callback, { label: 'player summaries' })
    },
    getFriendList: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${APIkey}&steamid=${id()}&relationship=friend`, callback, { requiresSteamId: true, label: 'friend list' })
    },
    getPlayerBans: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${APIkey}&steamids=${id()}`, callback, { requiresSteamId: true, label: 'player bans' })
    },

    // --- IPlayerService ---
    getOwnedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${APIkey}&steamid=${id()}&include_played_free_games=true&format=json`, callback, { requiresSteamId: true, label: 'owned games' })
    },
    getRecentlyPlayedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${APIkey}&steamid=${id()}&count=12&format=json`, callback, { requiresSteamId: true, label: 'recently played games' })
    },
    getSteamLevel: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${APIkey}&steamid=${id()}`, callback, { requiresSteamId: true, label: 'steam level' })
    },
    getBadges: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetBadges/v1/?key=${APIkey}&steamid=${id()}`, callback, { requiresSteamId: true, label: 'badges' })
    },

    // --- ISteamUserStats ---
    getPlayerAchievements: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${APIkey}&steamid=${id()}&appid=${appid}&format=json`, callback, { requiresSteamId: true, label: 'player achievements' })
    },
    getUserStatsForGame: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?key=${APIkey}&steamid=${id()}&appid=${appid}`, callback, { requiresSteamId: true, label: 'user stats for game' })
    },
    getGameSchema: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${APIkey}&appid=${appid}`, callback)
    },
    getGlobalAchievementPercentages: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${appid}&format=json`, callback)
    },

    // --- ISteamNews ---
    getNewsForApp: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appid}&count=10&maxlength=500&format=json`, callback)
    },

    // --- Steam Store API ---
    getGameDetails: (appid, callback) => {
        makeApiCall(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us`, callback)
    },
    searchStore: (query, callback) => {
        makeApiCall(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us&l=en`, callback)
    },

    // --- HowLongToBeat ---
    howLongToBeat: (appid, callback) => {
        makeApiCall(`https://hltbapi.codepotatoes.de/steam/${appid}`, callback)
    },

    // --- Steam Store Featured ---
    getFeaturedGames: (callback) => {
        makeApiCall(`https://store.steampowered.com/api/featuredcategories/?cc=us`, callback)
    },
}
