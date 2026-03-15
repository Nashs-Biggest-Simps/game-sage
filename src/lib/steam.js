



// Steam API Call File

const steamID = "76561199687209554"
const APIkey = "20C1F35B7542A2AA3770FBCA32674486" // public in github, dont care, no cost, will hide for production
const commands = {
    "getPlayerSummary": (id) => { 
        return `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${APIkey}&steamids=${id}` 
    },
    "getRecentlyPlayedGames": (id) => {
        return `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${APIkey}&steamid=${id}&format=json`
    },
    "getOwnedGames": (id) => {
        return `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${APIkey}&steamid=${id}&format=json`
    }

}

async function callAPI(url) {
    const res = await fetch(`/api?endpoint=${encodeURIComponent(endpoint)}`)
    const data = await res.json()
    return data
}

export async function steamAPICall(cmd, callback) {
    console.log("API Call Made:", cmd)
    if (commands[cmd]) {
        const res = await fetch(`/api?endpoint=${commands[cmd](steamID)}`)
        const data = await res.json()
        if (callback) callback(data)
        else return data
    }
    else {
        console.error("steamAPICall: Command does not exist")
    }
}