



// Steam API Call File

// const steamID = "76561199687209554"
// const steamID = "76561198093685592"
const steamID = "76561198240385412"
const APIkey = "20C1F35B7542A2AA3770FBCA32674486" // public in github, dont care, no cost, will hide for production

async function callAPI(url) {
    const res = await fetch(`/api?endpoint=${encodeURIComponent(endpoint)}`)
    const data = await res.json()
    return data
}

async function makeApiCall(url, callback) {
    console.log("API Call Made:", url)
    const res = await fetch(`/api?endpoint=${url}`)
    const data = await res.json()
    console.log(data)
    if (callback) callback(data)
    else return data
}

export const steamAPI = {
    getPlayerSummary: (callback) => { 
        makeApiCall(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${APIkey}&steamids=${steamID}`, callback)
    },
    getRecentlyPlayedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${APIkey}&steamid=${steamID}&format=json`, callback)
    },
    getOwnedGames: (callback) => {
        makeApiCall(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${APIkey}&steamid=${steamID}&format=json`, callback)
    },
    getGameDetails: (appid, callback) => {
        makeApiCall(`https://store.steampowered.com/api/appdetails?appids=${appid}`, callback)
    },
    howLongToBeat: (appid, callback) => {
        makeApiCall(`https://hltbapi.codepotatoes.de/steam/${appid}`, callback)
    }
}