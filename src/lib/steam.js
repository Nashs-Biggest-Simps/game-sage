
// Steam API Call File

// export const steamID = "76561199687209554" // aaron
export const steamID = "76561198093685592" // owen
// export const steamID = "76561198240385412" // dylan
const APIkey = "20C1F35B7542A2AA3770FBCA32674486" // public in github, dont care, no cost, will hide for production

async function makeApiCall(url, callback) {
    console.log("API Call Made:", url)
    const res = await fetch(`/api?endpoint=${url}`)
    const data = await res.json()
    if (callback) callback(data)
    else return data
}

export const steamAPI = {

    // --- ISteamUser ---
    getPlayerSummary: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${APIkey}&steamids=${steamID}`, callback)
    },
    getFriendList: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${APIkey}&steamid=${steamID}&relationship=friend`, callback)
    },
    getPlayerBans: (callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${APIkey}&steamids=${steamID}`, callback)
    },

    // --- IPlayerService ---
    getOwnedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${APIkey}&steamid=${steamID}&format=json`, callback)
    },
    getRecentlyPlayedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${APIkey}&steamid=${steamID}&count=4&format=json`, callback)
    },
    getSteamLevel: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${APIkey}&steamid=${steamID}`, callback)
    },
    getBadges: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetBadges/v1/?key=${APIkey}&steamid=${steamID}`, callback)
    },

    // --- ISteamUserStats ---
    getPlayerAchievements: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${APIkey}&steamid=${steamID}&appid=${appid}&format=json`, callback)
    },
    getUserStatsForGame: (appid, callback) => {
        makeApiCall(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?key=${APIkey}&steamid=${steamID}&appid=${appid}`, callback)
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

    // --- Custom Server ---
    customServerCall: (req, callback) => {
        makeApiCall(`http://localhost:3000/steam/${req}`, callback)
    }
}
