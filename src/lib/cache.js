// cache.js
// Centralized cache manager for GameSage.
// All game detail objects live in db.game_details[appid].
// Collections store only arrays of appids; details are resolved on demand.

import { get } from 'svelte/store'
import { db } from '$lib/data'
import { steamAPI } from '$lib/steam'

// ─── TTLs (milliseconds) ─────────────────────────────────────────────────────

const TTL = {
    user:           1  * 60 * 60 * 1000,
    libraryList:    6  * 60 * 60 * 1000,
    gameDetails:    7  * 24 * 60 * 60 * 1000,
    recentlyPlayed: 15 * 60 * 1000,
    friends:        60 * 1000,
}

const DETAIL_BATCH_SIZE = 10

// ─── Thumbnail resolver ──────────────────────────────────────────────────────

export async function resolveThumbnail(appid) {
    const candidates = [
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
    ]
    for (const url of candidates) {
        try {
            const r = await fetch(url, { method: 'HEAD' })
            if (r.ok) return url
        } catch {}
    }
    return null
}

// ─── Game detail slimmer ─────────────────────────────────────────────────────

async function slimGame(d) {
    if (!d) return null
    const thumbnail = (await resolveThumbnail(d.steam_appid)) ?? d.header_image ?? null
    return {
        steam_appid:       d.steam_appid,
        name:              d.name,
        thumbnail,
        is_free:           d.is_free ?? false,
        short_description: d.short_description?.slice(0, 300) ?? '',
        genres:            (d.genres        ?? []).map(g => ({ description: g.description })),
        categories:        (d.categories    ?? []).map(c => ({ description: c.description })),
        developers:        (d.developers    ?? []).slice(0, 3),
        publishers:        (d.publishers    ?? []).slice(0, 2),
        release_date:      d.release_date   ?? null,
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

function snap() { return get(db) }

function patchCache(updater) {
    db.update(data => {
        data.cache                   ??= {}
        data.cache.library           ??= {}
        data.cache.library.blacklist ??= []
        data.cache.recently_played   ??= {}
        updater(data.cache)
        return data
    })
}

function patchGameDetail(appid, slimData, source = 'library') {
    db.update(data => {
        data.game_details ??= {}
        data.game_details[appid] = { data: slimData, fetchedAt: Date.now(), source }
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
            data.cache      ??= {}
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
            c.library.ids      = games.map(g => g.appid)
            c.library.playtime = Object.fromEntries(games.map(g => [g.appid, g.playtime_forever]))
            c.library.fetchedAt = Date.now()
        })
        refreshDetailBatch(snap().cache)
    })
}

function refreshRecentlyPlayed(cache) {
    if (!isStale(cache.recently_played?.fetchedAt, TTL.recentlyPlayed)) return
    steamAPI.getRecentlyPlayedGames(res => {
        patchCache(c => {
            c.recently_played = {
                items:     res?.response?.games || [],
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

function refreshDetailBatch(cache) {
    const ids       = cache.library?.ids || []
    const blacklist = new Set(cache.library?.blacklist || [])
    const details   = snap().game_details || {}

    const pending = ids.filter(id =>
        !blacklist.has(id) &&
        (!details[id]?.data || isStale(details[id].fetchedAt, TTL.gameDetails))
    )

    if (pending.length === 0) return

    const batch = pending.slice(0, DETAIL_BATCH_SIZE)
    console.log(`[Cache] Fetching details: ${batch.length} now, ${pending.length - batch.length} remaining`)

    batch.forEach(appid => {
        steamAPI.getGameDetails(appid, async res => {
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(appid)) c.library.blacklist.push(appid)
                })
                return
            }
            const slim = await slimGame(res?.[appid]?.data)
            if (!slim) return
            patchGameDetail(appid, slim, 'library')
        })
    })
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startCacheUpdateCycle() {
    patchCache(() => {})

    const data = snap()
    if (!data.steamID) return

    const cache = data.cache

    refreshUser(cache)
    refreshLibraryList(cache)
    refreshRecentlyPlayed(cache)
    refreshDetailBatch(cache)
}

export function getGameDetail(appid) {
    return snap().game_details?.[appid]?.data ?? null
}

export function fetchGameDetail(appid, source = 'library') {
    return new Promise(resolve => {
        steamAPI.getGameDetails(appid, async res => {
            if (res?.[appid]?.success === false) {
                patchCache(c => {
                    if (!c.library.blacklist.includes(appid)) c.library.blacklist.push(appid)
                })
                resolve(null)
                return
            }
            const slim = await slimGame(res?.[appid]?.data)
            if (slim) patchGameDetail(appid, slim, source)
            resolve(slim ?? null)
        })
    })
}

export function getCachedLibrary() {
    const { game_details = {}, cache } = snap()
    const blacklist = new Set(cache?.library?.blacklist ?? [])
    return Object.entries(game_details)
        .filter(([id, entry]) => entry?.data && entry.source !== 'buy' && !blacklist.has(Number(id)))
        .map(([, entry]) => entry.data)
}

export function buildCompactProfile(brain = null) {
    const data        = snap()
    const cache       = data.cache ?? {}
    const gameDetails = data.game_details ?? {}
    const playtime    = cache.library?.playtime ?? {}
    const recent      = cache.recently_played?.items ?? []

    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && gameDetails[id]?.data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id, mins]) => {
            const d      = gameDetails[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${d.name}[${genres}]:${Math.round(mins / 60)}h`
        })

    const unplayedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins === 0 && gameDetails[id]?.data)
        .map(([id]) => {
            const d      = gameDetails[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${id}|${d.name}|${genres}`
        })

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

export function buildBuyProfile(brain = null) {
    const data        = snap()
    const cache       = data.cache ?? {}
    const gameDetails = data.game_details ?? {}
    const playtime    = cache.library?.playtime ?? {}
    const recent      = cache.recently_played?.items ?? []

    const playedLines = Object.entries(playtime)
        .filter(([id, mins]) => mins > 0 && gameDetails[id]?.data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 25)
        .map(([id, mins]) => {
            const d      = gameDetails[id].data
            const genres = (d.genres || []).map(g => g.description).join(',')
            return `${d.name}[${genres}]:${Math.round(mins / 60)}h`
        })

    const recentLines = recent
        .slice(0, 5)
        .map(g => `${g.name}:${Math.round((g.playtime_2weeks || 0) / 60)}h`)

    const ownedNames = Object.entries(playtime)
        .filter(([id]) => gameDetails[id]?.data)
        .map(([id]) => gameDetails[id].data.name)
        .slice(0, 60)

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
