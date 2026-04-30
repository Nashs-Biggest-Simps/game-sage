const LOCAL_ROW_LIMIT = 12
const MOST_PLAYED_LIMIT = 12
const MIN_FRIEND_NOT_OWNED_RESULTS = 4
const FRIEND_TREND_RECENT_HOURS = 48
const FRIEND_TREND_MIN_TRACKED_HOURS = 2
const FRIEND_NOT_OWNED_MIN_TRACKED_HOURS = 3

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function appKey(appid) {
    return String(appid)
}

function steamCapsule(appid) {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`
}

function lowerList(values = []) {
    return values.map(value => String(value).toLowerCase())
}

function byScoreThenName(a, b) {
    return b.score - a.score || (a.game?.name ?? a.name ?? '').localeCompare(b.game?.name ?? b.name ?? '')
}

function isUnsupportedStoreType(game) {
    return game?.type === 'dlc' || game?.type === 'demo'
}

function toGameCard(game, playtime = 0, reason = null) {
    return {
        appid:            game.steam_appid,
        name:             game.name,
        thumbnail:        game.thumbnail ?? null,
        playtime_forever: playtime,
        ...(reason ? { reason } : {}),
    }
}

function isOwned(ownedSet, appid) {
    return ownedSet.has(appid) || ownedSet.has(appKey(appid)) || ownedSet.has(Number(appid))
}

function hasOwnedPlaytimeEntry(playtime, appid) {
    return (
        Object.prototype.hasOwnProperty.call(playtime, appid) ||
        Object.prototype.hasOwnProperty.call(playtime, appKey(appid)) ||
        Object.prototype.hasOwnProperty.call(playtime, Number(appid))
    )
}

// ─── Genre Helpers ───────────────────────────────────────────────────────────

export function genreNames(game) {
    return (game?.genres ?? [])
        .map(genre => genre.description)
        .filter(Boolean)
}

export function hasExcludedGenre(game, excluded = []) {
    if (!excluded.length) return false

    const gameGenres = lowerList(genreNames(game))
    return lowerList(excluded).some(genre => gameGenres.includes(genre))
}

export function buildGenreWeights(games) {
    const weights = new Map()

    for (const { game, playtime } of games) {
        if (playtime <= 0) continue

        const hours = Math.max(1, Math.round(playtime / 60))
        for (const genre of genreNames(game)) {
            weights.set(genre, (weights.get(genre) ?? 0) + hours)
        }
    }

    return weights
}

export function topGenreMatch(game, weights, preferred = []) {
    const genres = genreNames(game)
    const preferredGenres = lowerList(preferred)
    const preferredMatch = genres.find(genre => preferredGenres.includes(genre.toLowerCase()))

    if (preferredMatch) return preferredMatch

    return genres
        .map(genre => ({ genre, weight: weights.get(genre) ?? 0 }))
        .sort((a, b) => b.weight - a.weight)[0]?.genre ?? null
}

// ─── Library Normalization ───────────────────────────────────────────────────

export function buildLibraryGames(details, playtime, blacklist = new Set()) {
    return Object.entries(details)
        .map(([id, entry]) => {
            const game = entry?.data
            if (!game?.steam_appid) return null
            if (blacklist.has(appKey(id)) || blacklist.has(appKey(game.steam_appid))) return null
            if (!hasOwnedPlaytimeEntry(playtime, id) && !hasOwnedPlaytimeEntry(playtime, game.steam_appid)) return null

            return {
                game,
                playtime: playtime[id] ?? playtime[game.steam_appid] ?? 0,
            }
        })
        .filter(Boolean)
}

function playableLibraryEntries(games, excluded = []) {
    return games.filter(({ game }) => (
        !isUnsupportedStoreType(game) &&
        !hasExcludedGenre(game, excluded)
    ))
}

// ─── Local Library Suggestions ───────────────────────────────────────────────

function scoreLibrarySuggestion({ game, playtime }, weights, preferred = []) {
    const genres = genreNames(game)
    const maxWeight = Math.max(...weights.values(), 1)
    const preferredGenres = lowerList(preferred)
    const playtimeHours = playtime / 60

    const genreScore = genres.reduce((sum, genre) => {
        const preferredBoost = preferredGenres.includes(genre.toLowerCase()) ? maxWeight * 0.5 : 0
        return sum + (weights.get(genre) ?? 0) + preferredBoost
    }, 0)

    const qualityScore = (game.metacritic_score ?? 0) * (maxWeight / 100)
    const unplayedBoost = playtime === 0 ? maxWeight * 2 : 0
    const lowPlaytimeBoost = playtime > 0
        ? Math.max(0, maxWeight - Math.log(playtimeHours + 1) * 20)
        : 0

    return genreScore + qualityScore + unplayedBoost + lowPlaytimeBoost
}

function librarySuggestionReason(game, playtime, genreMatch) {
    if (playtime === 0) {
        return genreMatch
            ? `Matches your ${genreMatch} playtime`
            : 'Unplayed in your library'
    }

    return genreMatch
        ? `Low-playtime ${genreMatch} pick from your library`
        : 'Worth another look from your library'
}

function limitPerPrimaryGenre(items, limit) {
    const genreCounts = {}

    return items.filter(item => {
        genreCounts[item.primaryGenre] = (genreCounts[item.primaryGenre] ?? 0) + 1
        return genreCounts[item.primaryGenre] <= limit
    })
}

// Scores owned games by the genres the user actually plays, then prioritizes
// unplayed and low-playtime games that fit those habits.
export function buildLocalLibrarySuggestions(games, preferred = [], excluded = []) {
    const weights = buildGenreWeights(games)

    return limitPerPrimaryGenre(
        playableLibraryEntries(games, excluded)
            .map(entry => {
                const { game, playtime } = entry
                const match = topGenreMatch(game, weights, preferred)
                const primaryGenre = genreNames(game)[0] ?? 'Other'

                return {
                    game,
                    primaryGenre,
                    score: scoreLibrarySuggestion(entry, weights, preferred),
                    reason: librarySuggestionReason(game, playtime, match),
                }
            })
            .sort(byScoreThenName),
        LOCAL_ROW_LIMIT
    ).slice(0, LOCAL_ROW_LIMIT)
}

export function buildNoAiSuggestions(games, librarySuggestions, preferred = [], excluded = []) {
    const usedAppIds = new Set(librarySuggestions.map(item => appKey(item.game?.steam_appid)))
    const weights = buildGenreWeights(games)

    return playableLibraryEntries(games, excluded)
        .filter(({ game }) => !usedAppIds.has(appKey(game.steam_appid)))
        .map(({ game, playtime }) => {
            const match = topGenreMatch(game, weights, preferred)
            const score = (playtime > 0 ? Math.log(playtime + 1) * 100 : 0)
                + genreNames(game).reduce((sum, genre) => sum + (weights.get(genre) ?? 0), 0)

            return {
                game,
                score,
                reason: playtime > 0
                    ? 'No-AI pick based on your existing playtime.'
                    : match
                        ? `No-AI pick from your library with ${match} tags.`
                        : 'No-AI pick from your cached library.',
            }
        })
        .sort(byScoreThenName)
        .slice(0, LOCAL_ROW_LIMIT)
}

// ─── Dashboard Library Rows ──────────────────────────────────────────────────

export function buildMostPlayedGames(details, playtime, limit = MOST_PLAYED_LIMIT, blacklist = new Set()) {
    return buildLibraryGames(details, playtime, blacklist)
        .filter(entry => entry.playtime > 0)
        .sort((a, b) => b.playtime - a.playtime)
        .slice(0, limit)
        .map(({ game, playtime: minutes }) => toGameCard(game, minutes))
}

export function buildGenreSpotlight(games, targetGenre, excluded = []) {
    if (!targetGenre) return []

    const weights = buildGenreWeights(games)
    const target = targetGenre.toLowerCase()

    return games
        .filter(({ game, playtime }) => (
            playtime === 0 &&
            !hasExcludedGenre(game, excluded) &&
            genreNames(game).some(genre => genre.toLowerCase() === target)
        ))
        .map(({ game }) => ({
            ...toGameCard(game, 0, `${targetGenre} · unplayed in your library`),
            score: genreNames(game).reduce((sum, genre) => sum + (weights.get(genre) ?? 0), 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, LOCAL_ROW_LIMIT)
}

// ─── Friend-Based Rows ───────────────────────────────────────────────────────

function parseHourBucketKey(key) {
    const timestamp = Date.parse(`${key}:00:00Z`)
    return Number.isFinite(timestamp) ? timestamp : null
}

function collectLiveFriendCounts(friends = [], { excludeOwned = null } = {}) {
    const live = new Map()

    for (const friend of friends ?? []) {
        if (!friend?.gameid) continue

        const key = appKey(friend.gameid)
        if (excludeOwned && isOwned(excludeOwned, key)) continue

        const existing = live.get(key) ?? {
            gameid: Number(friend.gameid),
            name: friend.gameextrainfo ?? `App ${friend.gameid}`,
            liveFriends: 0,
        }

        existing.liveFriends++
        live.set(key, existing)
    }

    return live
}

function buildFriendTrendPool(byHour = {}, friends = [], { excludeOwned = null } = {}) {
    if (!byHour || !Object.keys(byHour).length) return []

    const now = Date.now()
    const recentCutoff = now - FRIEND_TREND_RECENT_HOURS * 60 * 60 * 1000
    const games = new Map()

    for (const [hourKey, bucket] of Object.entries(byHour)) {
        const bucketTimestamp = parseHourBucketKey(hourKey)
        if (!bucketTimestamp) continue

        const ageHours = Math.max(0, (now - bucketTimestamp) / (60 * 60 * 1000))
        const recencyWeight = (
            ageHours <= 24 ? 2.8 :
            ageHours <= 48 ? 2.2 :
            ageHours <= 96 ? 1.6 :
            ageHours <= 168 ? 1.2 :
            1
        )
        const dayKey = hourKey.slice(0, 10)

        for (const [gameid, entry] of Object.entries(bucket ?? {})) {
            if (excludeOwned && isOwned(excludeOwned, gameid)) continue

            const peak = Number(entry?.peak ?? 0)
            if (!peak) continue

            const key = appKey(gameid)
            const existing = games.get(key) ?? {
                gameid: Number(gameid),
                name: entry?.name ?? `App ${gameid}`,
                totalPeak: 0,
                weightedPeak: 0,
                peakFriends: 0,
                hoursSeen: 0,
                recentPeak: 0,
                recentHours: 0,
                liveFriends: 0,
                lastSeenAt: 0,
                dayKeys: new Set(),
            }

            existing.totalPeak += peak
            existing.weightedPeak += peak * recencyWeight
            existing.peakFriends = Math.max(existing.peakFriends, peak)
            existing.hoursSeen++
            existing.lastSeenAt = Math.max(existing.lastSeenAt, bucketTimestamp)
            existing.dayKeys.add(dayKey)

            if (bucketTimestamp >= recentCutoff) {
                existing.recentPeak += peak
                existing.recentHours++
            }

            games.set(key, existing)
        }
    }

    const liveCounts = collectLiveFriendCounts(friends, { excludeOwned })
    for (const [key, live] of liveCounts.entries()) {
        const existing = games.get(key)
        if (!existing) continue
        existing.liveFriends = live.liveFriends
        existing.name = existing.name || live.name
        existing.weightedPeak += live.liveFriends * 0.75
    }

    return [...games.values()].map(game => {
        const uniqueDays = game.dayKeys.size
        const olderPeak = Math.max(game.totalPeak - game.recentPeak, 0)
        const olderHours = Math.max(game.hoursSeen - game.recentHours, 0)
        const recentAverage = game.recentHours > 0 ? game.recentPeak / game.recentHours : 0
        const olderAverage = olderHours > 0 ? olderPeak / olderHours : 0
        const momentum = Math.max(0, recentAverage - olderAverage)

        return {
            ...game,
            uniqueDays,
            momentum,
            score:
                game.weightedPeak +
                game.recentPeak * 1.6 +
                game.hoursSeen * 2.4 +
                uniqueDays * 4.2 +
                game.peakFriends * 3.4 +
                momentum * 5.5,
        }
    })
}

function qualifiesFriendTrend(game, { minTrackedHours = FRIEND_TREND_MIN_TRACKED_HOURS } = {}) {
    return (
        game.hoursSeen >= minTrackedHours ||
        game.uniqueDays >= 2
    )
}

function friendTrendReason(game, { notOwned = false } = {}) {
    const cadence = game.uniqueDays >= 2
        ? `tracked across ${game.uniqueDays} days`
        : `tracked across ${game.hoursSeen} hours`
    const peak = game.peakFriends === 1
        ? 'peaking at 1 friend'
        : `peaking at ${game.peakFriends} friends`
    const live = game.liveFriends > 0
        ? ` · ${game.liveFriends} playing now`
        : ''

    if (notOwned) {
        return `${cadence} in your circle, ${peak}${live} · not in your library`
    }

    if (game.momentum >= 0.75 && game.recentHours >= 2) {
        return `${cadence}, ${peak}${live} · gaining momentum lately`
    }

    return `${cadence} in your circle, ${peak}${live}`
}

export function buildFriendFavorites(friends, details, playtime) {
    const inGame = friends.filter(friend => friend.gameid)
    if (!inGame.length) return []

    const ownedIds = new Set(Object.keys(playtime).map(appKey))
    const games = {}

    for (const friend of inGame) {
        const key = appKey(friend.gameid)
        const detail = details[key]?.data ?? null

        games[key] ??= {
            appid:            Number(key),
            name:             detail?.name ?? friend.gameextrainfo ?? 'Unknown',
            thumbnail:        detail?.thumbnail ?? null,
            playtime_forever: playtime[key] ?? 0,
            owned:            ownedIds.has(key),
            friendCount:      0,
            friendNames:      [],
        }

        games[key].friendCount++
        games[key].friendNames.push(friend.personaname)
    }

    return Object.values(games)
        .sort((a, b) => {
            if (a.owned !== b.owned) return a.owned ? -1 : 1
            return b.friendCount - a.friendCount
        })
        .slice(0, LOCAL_ROW_LIMIT)
        .map(game => ({
            ...game,
            reason: game.friendCount === 1
                ? `${game.friendNames[0]} is playing right now`
                : `${game.friendCount} friends playing right now`,
        }))
}

// Shows games that friend groups have collectively played over the stored
// popularity window.
export function buildFriendGroupFavorites(byHour, friends = [], limit = LOCAL_ROW_LIMIT) {
    return buildFriendTrendPool(byHour, friends)
        .filter(game => qualifiesFriendTrend(game))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, limit)
        .map(game => ({
            appid:            game.gameid,
            name:             game.name,
            thumbnail:        steamCapsule(game.gameid),
            playtime_forever: 0,
            reason:           friendTrendReason(game),
        }))
}

// Same friend signal, but only for games the user does not own.
export function buildFriendNotOwned(byHour, ownedSet = new Set(), friends = [], limit = LOCAL_ROW_LIMIT) {
    const results = buildFriendTrendPool(byHour, friends, { excludeOwned: ownedSet })
        .filter(game => qualifiesFriendTrend(game, { minTrackedHours: FRIEND_NOT_OWNED_MIN_TRACKED_HOURS }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

    if (results.length < MIN_FRIEND_NOT_OWNED_RESULTS) return []

    return results
        .slice(0, limit)
        .map(game => ({
            appid:            game.gameid,
            name:             game.name,
            thumbnail:        steamCapsule(game.gameid),
            playtime_forever: 0,
            reason:           friendTrendReason(game, { notOwned: true }),
        }))
}
