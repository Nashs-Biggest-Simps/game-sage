// cache.js
// Centralized cache manager for GameSage.
// Handles TTL-based invalidation and incremental Steam data loading
// so the rest of the app can read from db.cache without worrying about staleness.

import { get } from 'svelte/store'
import { db } from '$lib/data'
import { steamAPI } from '$lib/steam'

// ─── TTLs (milliseconds) ─────────────────────────────────────────────────────

const TTL = {
    user:           1  * 60 * 60 * 1000,       //  1 hour
    libraryList:    6  * 60 * 60 * 1000,       //  6 hours
    gameDetails:    7  * 24 * 60 * 60 * 1000,  //  7 days
    recentlyPlayed: 15 * 60 * 1000,            // 15 minutes
    friends:        60 * 1000,                 // 60 seconds
}

// Number of game-detail requests to fire per update cycle.
// Low enough to not hammer the API, high enough to fill the cache over a few sessions.
const DETAIL_BATCH_SIZE = 4

// ─── Internal helpers ────────────────────────────────────────────────────────

function isStale(fetchedAt, ttl) {
    if (!fetchedAt) return true
    return (Date.now() - fetchedAt) > ttl
}

// Synchronously read the current store value
function snap() {
    return get(db)
}

// Apply an update to db.cache, guaranteeing the nested structure always exists
function patchCache(updater) {
    db.update(data => {
        if (!data.cache)                       data.cache = {}
        if (!data.cache.library)               data.cache.library = {}
        if (!data.cache.library.details)       data.cache.library.details = {}
        if (!data.cache.library.blacklist)     data.cache.library.blacklist = []
        if (!data.cache.recentlyPlayed)        data.cache.recentlyPlayed = {}
        updater(data.cache)
        return data
    })
}

// ─── Individual refresh functions ────────────────────────────────────────────

function refreshUser(cache) {
    if (!isStale(cache.user?.fetchedAt, TTL.user)) return
    steamAPI.getPlayerSummary(res => {
        const player = res?.response?.players?.[0]
        if (!player) return
        db.update(data => {
            if (!data.cache) data.cache = {}
            data.cache.user = { data: player, fetchedAt: Date.now() }
            return data
        })
    })
}

function refreshLibraryList(cache) {
    if (!isStale(cache.library?.fetchedAt, TTL.libraryList)) return
    steamAPI.getOwnedGames(res => {
        const games = res?.response?.games || []
        patchCache(c => {
            c.library.appIdList = games.map(g => g.appid)
            c.library.playtime  = Object.fromEntries(
                games.map(g => [g.appid, g.playtime_forever])
            )
            c.library.fetchedAt = Date.now()
        })
        // Kick off detail loading as soon as the list is available
        const freshCache = snap().cache
        refreshDetailBatch(freshCache)
    })
}

function refreshRecentlyPlayed(cache) {
    if (!isStale(cache.recentlyPlayed?.fetchedAt, TTL.recentlyPlayed)) return
    steamAPI.getRecentlyPlayedGames(res => {
        patchCache(c => {
            c.recentlyPlayed = {
                data:      res?.response?.games || [],
                fetchedAt: Date.now(),
            }
        })
    })
}

export function refreshFriends() {
    const cache = snap().cache
    if (!isStale(cache?.friends?.fetchedAt, TTL.friends)) return
    steamAPI.getFriendList(data => {
        const ids = (data?.friendslist?.friends ?? []).map(f => f.steamid)
        if (!ids.length) {
            patchCache(c => { c.friends = { data: [], fetchedAt: Date.now() } })
            return
        }
        steamAPI.getPlayerSummaries(ids.slice(0, 100), res => {
            const players = (res?.response?.players ?? []).sort((a, b) => {
                const sa = a.gameid ? 2 : a.personastate > 0 ? 1 : 0
                const sb = b.gameid ? 2 : b.personastate > 0 ? 1 : 0
                if (sa !== sb) return sb - sa
                return (b.lastlogoff ?? 0) - (a.lastlogoff ?? 0)
            })
            patchCache(c => { c.friends = { data: players, fetchedAt: Date.now() } })
        })
    })
}

// Fetch details for the next batch of games that are missing or stale.
// This is designed to be called repeatedly across sessions — each call
// fills in a few more entries until the full library is cached.
function refreshDetailBatch(cache) {
    const appIdList = cache.library?.appIdList || []
    const details   = cache.library?.details   || {}

    const blacklist = new Set(cache.library?.blacklist || [])
    const pending = appIdList.filter(id =>
        !blacklist.has(id) &&
        (!details[id]?.data || isStale(details[id].fetchedAt, TTL.gameDetails))
    )

    if (pending.length === 0) return

    const batch = pending.slice(0, DETAIL_BATCH_SIZE)
    console.log(
        `[Cache] Fetching details: ${batch.length} now, ${pending.length - batch.length} remaining`
    )

    batch.forEach(appid => {
        steamAPI.getGameDetails(appid, res => {
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(appid)) c.library.blacklist.push(appid)
                })
                return
            }
            const gameData = res?.[appid]?.data
            if (!gameData) return
            patchCache(c => {
                c.library.details[appid] = { data: gameData, fetchedAt: Date.now() }
            })
        })
    })
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize cache structure and run one update cycle.
 * Call this from +layout.svelte on mount.
 */
export function startCacheUpdateCycle() {
    patchCache(() => {})

    const data = snap()
    if (!data.steamID) return   // nothing to fetch without a Steam ID

    const cache = data.cache

    refreshUser(cache)
    refreshLibraryList(cache)
    refreshRecentlyPlayed(cache)
    refreshDetailBatch(cache)
}

/**
 * Return the cached Steam store detail object for a single appid, or null.
 */
export function getGameDetail(appid) {
    return snap().cache?.library?.details?.[appid]?.data ?? null
}

/**
 * Fetch and cache details for a single game immediately.
 * Returns a Promise that resolves with the game data (or null on failure).
 */
export function fetchGameDetail(appid) {
    return new Promise((resolve) => {
        steamAPI.getGameDetails(appid, res => {
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(appid)) c.library.blacklist.push(appid)
                })
                resolve(null)
                return
            }
            const gameData = res?.[appid]?.data
            if (gameData) {
                patchCache(c => {
                    c.library.details[appid] = { data: gameData, fetchedAt: Date.now() }
                })
            }
            resolve(gameData ?? null)
        })
    })
}

/**
 * Return all cached game detail objects as a flat array.
 */
export function getCachedLibrary() {
    const library   = snap().cache?.library ?? {}
    const details   = library.details  ?? {}
    const blacklist = new Set(library.blacklist ?? [])
    return Object.entries(details)
        .filter(([id, entry]) => entry?.data && !blacklist.has(id))
        .map(([, entry]) => entry.data)
}

/**
 * Build a compact, token-efficient user profile string for the Claude prompt.
 * Returns an object with the prompt text and validity metadata.
 *
 * Format (all on separate lines):
 *   PLAYED:
 *   Game Name[Genre1,Genre2]:Xh
 *   ...
 *   RECENT:
 *   Game Name:Xh
 *   ...
 *   UNPLAYED_OWNED:
 *   appid|Game Name|Genre1,Genre2
 *   ...
 *   <instruction line>
 */
export function buildCompactProfile(brain = null) {
    const data     = snap()
    const cache    = data.cache ?? {}
    const details  = cache.library?.details  ?? {}
    const playtime = cache.library?.playtime ?? {}
    const recent   = cache.recentlyPlayed?.data ?? []

    // Top 20 most-played games that have cached details
    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && details[id]?.data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id, mins]) => {
            const d      = details[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${d.name}[${genres}]:${Math.round(mins / 60)}h`
        })

    // All unplayed owned games that have cached details (playtime === 0)
    const unplayedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins === 0 && details[id]?.data)
        .map(([id]) => {
            const d      = details[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${id}|${d.name}|${genres}`
        })

    // Up to 5 recently active games
    const recentLines = recent
        .slice(0, 5)
        .map(g => `${g.name}:${Math.round((g.playtime_2weeks || 0) / 60)}h`)

    const lines = [
        'PLAYED:', ...playedLines, '',
        'RECENT:', ...recentLines, '',
        'UNPLAYED_OWNED:', ...unplayedLines, '',
    ]

    if (brain) lines.push('USER_FEEDBACK:', brain, '')

    lines.push('Suggest top 12 from UNPLAYED_OWNED matching play style. JSON only: {"s":[{"id":appid,"r":"one sentence reason"},...]}')

    return {
        text:          lines.join('\n'),
        playedCount:   playedLines.length,
        unplayedCount: unplayedLines.length,
    }
}

/**
 * Build a compact profile for buy suggestions (games not owned).
 * Includes PLAYED, RECENT, and a list of already-owned game names so
 * the AI knows what to exclude.
 */
export function buildBuyProfile(brain = null) {
    const data     = snap()
    const cache    = data.cache ?? {}
    const details  = cache.library?.details  ?? {}
    const playtime = cache.library?.playtime ?? {}
    const recent   = cache.recentlyPlayed?.data ?? []

    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && details[id]?.data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 25)
        .map(([id, mins]) => {
            const d      = details[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${d.name}[${genres}]:${Math.round(mins / 60)}h`
        })

    const recentLines = recent
        .slice(0, 5)
        .map(g => `${g.name}:${Math.round((g.playtime_2weeks || 0) / 60)}h`)

    // All owned game names so AI avoids re-suggesting them
    const ownedNames = Object.entries(playtime)
        .filter(([id]) => details[id]?.data)
        .map(([id]) => details[id].data.name)
        .slice(0, 60)

    const lines = [
        'PLAYED:', ...playedLines, '',
        'RECENT:', ...recentLines, '',
        'ALREADY_OWNED:', ...ownedNames, '',
    ]

    if (brain) lines.push('USER_FEEDBACK:', brain, '')

    lines.push('Suggest 8 Steam games not in ALREADY_OWNED that match this taste. JSON only: {"b":[{"n":"exact title","r":"one sentence reason"},...]}')

    return {
        text:        lines.join('\n'),
        playedCount: playedLines.length,
    }
}
