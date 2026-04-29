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

// Normal batch size per cycle — keeps Steam Store API load low across sessions.
const DETAIL_BATCH_SIZE = 4
// Larger burst used on first-ever load (empty detail cache) to populate the dashboard fast.
const INITIAL_BATCH_SIZE = 12

// ─── Thumbnail resolver ──────────────────────────────────────────────────────
// Returns the standard Steam capsule URL for a given appid. The browser
// <img> tag handles 404s gracefully — no HEAD probing needed (and HEAD
// requests to CDN are blocked by CORS anyway).

export function resolveThumbnail(appid) {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`
}

// ─── Game detail slimmer ─────────────────────────────────────────────────────
// Steam's appdetails endpoint returns ~10-50KB per game (screenshots, HTML
// descriptions, system requirements, etc.). We only store the fields we
// actually read so the detail cache stays well under localStorage quota.

function slimGame(d) {
    if (!d || !d.name || !d.steam_appid) return null
    const thumbnail = d.header_image ?? resolveThumbnail(d.steam_appid)
    return {
        steam_appid:       d.steam_appid,
        name:              d.name,
        type:              d.type ?? 'game',
        thumbnail,
        is_free:           d.is_free ?? false,
        short_description: d.short_description?.slice(0, 300) ?? '',
        genres:            (d.genres        ?? []).map(g => ({ description: g.description })),
        categories:        (d.categories    ?? []).map(c => ({ description: c.description })),
        developers:        (d.developers    ?? []).slice(0, 3),
        publishers:        (d.publishers    ?? []).slice(0, 2),
        release_date:      d.release_date   ?? null,
        metacritic_score:  d.metacritic?.score ?? null,
        price_overview:    d.price_overview ? {
            final_formatted:  d.price_overview.final_formatted,
            discount_percent: d.price_overview.discount_percent,
        } : null,
    }
}

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
        // Kick off detail loading — give recently-played a moment to resolve
        // so the priority sort can put those games at the front of the queue.
        setTimeout(() => refreshDetailBatch(snap().cache), 800)
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
            const nowPlaying = players.filter(p => p.gameid)
            patchCache(c => {
                c.friends = { data: players, fetchedAt: Date.now() }

                // Accumulate hourly popularity buckets for 7-day trend in PopularWithFriends.
                // Each bucket stores the peak concurrent friend count per game in that hour.
                if (nowPlaying.length) {
                    if (!c.friendPopularity) c.friendPopularity = {}
                    const hourKey = new Date().toISOString().slice(0, 13)
                    const cutoff  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 13)
                    for (const k of Object.keys(c.friendPopularity)) {
                        if (k < cutoff) delete c.friendPopularity[k]
                    }
                    if (!c.friendPopularity[hourKey]) c.friendPopularity[hourKey] = {}
                    for (const p of nowPlaying) {
                        const key   = String(p.gameid)
                        const count = nowPlaying.filter(p2 => String(p2.gameid) === key).length
                        const cur   = c.friendPopularity[hourKey][key] ?? { name: p.gameextrainfo, peak: 0 }
                        c.friendPopularity[hourKey][key] = { name: cur.name || p.gameextrainfo, peak: Math.max(cur.peak, count) }
                    }
                }
            })
        })
    })
}

// Fetch details for the next batch of games that are missing or stale.
// On first-ever load (empty detail cache) uses a larger burst and chains one
// follow-up batch so the dashboard gets useful data within a single session.
// Subsequent sessions use the normal batch size to stay gentle on the API.
function refreshDetailBatch(cache) {
    const appIdList  = cache.library?.appIdList || []
    const details    = cache.library?.details   || {}
    const blacklist  = new Set(cache.library?.blacklist || [])
    const recentIds  = new Set((cache.recentlyPlayed?.data || []).map(g => g.appid))
    const playtime   = cache.library?.playtime  || {}

    const isFirstLoad = Object.keys(details).length === 0
    const batchSize   = isFirstLoad ? INITIAL_BATCH_SIZE : DETAIL_BATCH_SIZE

    const pending = appIdList
        .filter(id =>
            !blacklist.has(id) &&
            (!details[id]?.data || isStale(details[id].fetchedAt, TTL.gameDetails))
        )
        .sort((a, b) => {
            // Recently played games first so the dashboard populates immediately
            const ra = recentIds.has(Number(a)) || recentIds.has(a) ? 1 : 0
            const rb = recentIds.has(Number(b)) || recentIds.has(b) ? 1 : 0
            if (ra !== rb) return rb - ra
            // Then by playtime descending
            return (playtime[b] ?? 0) - (playtime[a] ?? 0)
        })

    if (pending.length === 0) return

    const batch     = pending.slice(0, batchSize)
    const remaining = pending.length - batch.length
    console.log(`[Cache] Fetching details: ${batch.length} now, ${remaining} remaining`)

    let completed = 0
    batch.forEach(appid => {
        steamAPI.getGameDetails(appid, async res => {
            const key = String(appid)
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(key)) c.library.blacklist.push(key)
                })
            } else {
                const slim = slimGame(res?.[appid]?.data)
                if (slim) {
                    patchCache(c => {
                        c.library.details[appid] = { data: slim, fetchedAt: Date.now() }
                    })
                } else {
                    patchCache(c => {
                        if (!c.library.blacklist.includes(key)) c.library.blacklist.push(key)
                    })
                }
            }
            completed++
            // After the initial burst finishes, chain one more normal batch so
            // the library keeps filling without requiring another session.
            if (completed === batch.length && isFirstLoad && remaining > 0) {
                setTimeout(() => refreshDetailBatch(snap().cache), 1500)
            }
        })
    })
}

// Fetches Steam's featured categories (top sellers, new releases, specials)
// and caches a deduplicated list for the TrendingForYou row. 6h TTL.
async function refreshTrending(cache) {
    if (!isStale(cache?.trending?.fetchedAt, 6 * 60 * 60 * 1000)) return
    try {
        const res  = await fetch('/api?endpoint=https://store.steampowered.com/api/featuredcategories')
        if (!res.ok) return
        const data = await res.json()
        const pull = (key, tag) => (data?.[key]?.items ?? []).map(g => ({ ...g, _tag: tag }))
        const seen = new Set()
        const items = [...pull('new_releases', 'new'), ...pull('top_sellers', 'top'), ...pull('specials', 'sale')]
            .filter(g => g.id && !seen.has(g.id) && seen.add(g.id))
            .slice(0, 30)
            .map(g => ({
                appid:     g.id,
                name:      g.name,
                thumbnail: g.large_capsule_image ?? g.header_image ?? null,
                tag:       g._tag,
                discounted: g.discounted ?? false,
                finalPrice: g.final_price ?? null,
            }))
        patchCache(c => { c.trending = { items, fetchedAt: Date.now() } })
    } catch {
        // non-critical — row simply stays hidden
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize cache structure and run one update cycle.
 * Call this from +layout.svelte on mount.
 */
export function startCacheUpdateCycle() {
    patchCache(() => {})

    // Purge any cached entries that are missing required fields — they'll be
    // re-fetched (and blacklisted if they fail again) in the next detail batch.
    patchCache(c => {
        const details = c.library.details
        for (const id of Object.keys(details)) {
            const d = details[id]?.data
            if (d && (!d.name || !d.steam_appid)) delete details[id]
        }
    })

    const data = snap()
    if (!data.steamID) return   // nothing to fetch without a Steam ID

    const cache = data.cache

    refreshUser(cache)
    refreshLibraryList(cache)
    refreshRecentlyPlayed(cache)
    refreshDetailBatch(cache)
    refreshTrending(cache)
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
    const key = String(appid)
    return new Promise((resolve) => {
        steamAPI.getGameDetails(appid, async res => {
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(key)) c.library.blacklist.push(key)
                })
                resolve(null)
                return
            }
            const slim = slimGame(res?.[appid]?.data)
            if (slim) {
                patchCache(c => {
                    c.library.details[appid] = { data: slim, fetchedAt: Date.now() }
                })
            } else {
                patchCache(c => {
                    if (!c.library.blacklist.includes(key)) c.library.blacklist.push(key)
                })
            }
            resolve(slim ?? null)
        })
    })
}

/**
 * Return all cached game detail objects as a flat array.
 */
export function getCachedLibrary() {
    const library   = snap().cache?.library ?? {}
    const details   = library.details  ?? {}
    const blacklist = new Set((library.blacklist ?? []).map(String))
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
    const data      = snap()
    const cache     = data.cache ?? {}
    const details   = cache.library?.details  ?? {}
    const playtime  = cache.library?.playtime ?? {}
    const recent    = cache.recentlyPlayed?.data ?? []
    const blacklist = new Set((cache.library?.blacklist ?? []).map(String))

    // Top 20 most-played games that have cached details
    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && details[id]?.data && !blacklist.has(id))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id, mins]) => {
            const d      = details[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${d.name}[${genres}]:${Math.round(mins / 60)}h`
        })

    // All unplayed owned games that have cached details (playtime === 0)
    const unplayedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins === 0 && details[id]?.data && !blacklist.has(id))
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
    const data      = snap()
    const cache     = data.cache ?? {}
    const details   = cache.library?.details  ?? {}
    const playtime  = cache.library?.playtime ?? {}
    const recent    = cache.recentlyPlayed?.data ?? []
    const blacklist = new Set((cache.library?.blacklist ?? []).map(String))

    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && details[id]?.data && !blacklist.has(id))
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
        .filter(([id]) => details[id]?.data && !blacklist.has(id))
        .map(([id]) => details[id].data.name)
        .slice(0, 60)

    // Games friends are actively playing that the user doesn't own
    const friendGames = [...new Set(
        (cache.friends?.data ?? [])
            .filter(f => f.gameextrainfo)
            .map(f => f.gameextrainfo)
            .filter(name => !ownedNames.includes(name))
    )].slice(0, 10)

    const lines = [
        'PLAYED:', ...playedLines, '',
        'RECENT:', ...recentLines, '',
        'ALREADY_OWNED:', ...ownedNames, '',
    ]

    if (friendGames.length) lines.push('FRIENDS_PLAYING:', ...friendGames, '')
    if (brain)              lines.push('USER_FEEDBACK:', brain, '')

    lines.push('Suggest 8 Steam games not in ALREADY_OWNED that match this taste. Consider FRIENDS_PLAYING if present. JSON only: {"b":[{"n":"exact title","r":"one sentence reason"},...]}')

    return {
        text:        lines.join('\n'),
        playedCount: playedLines.length,
    }
}
