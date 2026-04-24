import { env } from '$env/dynamic/private'

const STEAM_API_KEY = env.STEAM_API_KEY ?? ''

const STEAM_WEB_ACTIONS = new Set([
    'playerSummary',
    'playerSummaries',
    'friendList',
    'playerBans',
    'ownedGames',
    'recentlyPlayed',
    'steamLevel',
    'badges',
    'playerAchievements',
    'userStatsForGame',
    'gameSchema',
])

function ensureSteamKey() {
    if (!STEAM_API_KEY) {
        throw new Error('STEAM_API_KEY is not configured.')
    }
}

/**
 * @param {string | null} value
 */
function digitsOnly(value) {
    return (value ?? '').replace(/[^\d]/g, '')
}

/**
 * @param {string | null} value
 */
function numberString(value) {
    const normalized = digitsOnly(value)
    if (!normalized) throw new Error('Missing numeric parameter.')
    return normalized
}

/**
 * @param {string | null} value
 */
function idList(value) {
    return (value ?? '')
        .split(',')
        .map((item) => digitsOnly(item))
        .filter(Boolean)
        .join(',')
}

function makeUrl(base, params) {
    const url = new URL(base)
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value)
        }
    }
    return url.toString()
}

/**
 * @param {string} action
 * @param {URLSearchParams} params
 */
function getUpstreamUrl(action, params) {
    if (STEAM_WEB_ACTIONS.has(action)) ensureSteamKey()

    switch (action) {
        case 'playerSummary':
            return makeUrl('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
                key: STEAM_API_KEY,
                steamids: numberString(params.get('steamid')),
            })
        case 'playerSummaries':
            return makeUrl('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
                key: STEAM_API_KEY,
                steamids: idList(params.get('ids')),
            })
        case 'friendList':
            return makeUrl('https://api.steampowered.com/ISteamUser/GetFriendList/v0001/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
                relationship: 'friend',
            })
        case 'playerBans':
            return makeUrl('https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/', {
                key: STEAM_API_KEY,
                steamids: numberString(params.get('steamid')),
            })
        case 'ownedGames':
            return makeUrl('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
                include_played_free_games: 'true',
                format: 'json',
            })
        case 'recentlyPlayed':
            return makeUrl('https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
                count: params.get('count') ?? '6',
                format: 'json',
            })
        case 'steamLevel':
            return makeUrl('https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
            })
        case 'badges':
            return makeUrl('https://api.steampowered.com/IPlayerService/GetBadges/v1/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
            })
        case 'playerAchievements':
            return makeUrl('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
                appid: numberString(params.get('appid')),
                format: 'json',
            })
        case 'userStatsForGame':
            return makeUrl('https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/', {
                key: STEAM_API_KEY,
                steamid: numberString(params.get('steamid')),
                appid: numberString(params.get('appid')),
            })
        case 'gameSchema':
            return makeUrl('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/', {
                key: STEAM_API_KEY,
                appid: numberString(params.get('appid')),
            })
        case 'globalAchievementPercentages':
            return makeUrl('https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/', {
                gameid: numberString(params.get('appid')),
                format: 'json',
            })
        case 'newsForApp':
            return makeUrl('https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/', {
                appid: numberString(params.get('appid')),
                count: params.get('count') ?? '10',
                maxlength: params.get('maxlength') ?? '500',
                format: 'json',
            })
        case 'gameDetails':
            return makeUrl('https://store.steampowered.com/api/appdetails', {
                appids: numberString(params.get('appid')),
                cc: 'us',
                l: 'en',
            })
        case 'searchStore':
            return makeUrl('https://store.steampowered.com/api/storesearch/', {
                term: params.get('query') ?? '',
                cc: 'us',
                l: 'en',
            })
        case 'howLongToBeat':
            return makeUrl(`https://hltbapi.codepotatoes.de/steam/${numberString(params.get('appid'))}`, {})
        case 'featuredGames':
            return makeUrl('https://store.steampowered.com/api/featuredcategories/', {
                cc: 'us',
                l: 'en',
            })
        default:
            throw new Error(`Unsupported action "${action}".`)
    }
}

/**
 * @param {string} action
 * @param {URLSearchParams} params
 */
export async function fetchSteamAction(action, params) {
    const upstream = getUpstreamUrl(action, params)
    const response = await fetch(upstream, {
        headers: {
            'User-Agent': 'GameSage/1.0',
        },
    })

    if (!response.ok) {
        throw new Error(`Upstream request failed (${response.status}) for ${action}.`)
    }

    return response.json()
}
