const LOCAL_ROW_LIMIT = 12
const MOST_PLAYED_LIMIT = 12
const MIN_FRIEND_NOT_OWNED_RESULTS = 4

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

function aggregateFriendPopularity(byHour = {}, { excludeOwned = null } = {}) {
    if (!byHour || !Object.keys(byHour).length) return []

    const games = {}

    for (const bucket of Object.values(byHour)) {
        for (const [gameid, { name, peak }] of Object.entries(bucket)) {
            if (excludeOwned && isOwned(excludeOwned, gameid)) continue

            games[gameid] ??= {
                gameid: Number(gameid),
                name,
                score: 0,
                peakFriends: 0,
            }

            games[gameid].score += peak
            games[gameid].peakFriends = Math.max(games[gameid].peakFriends, peak)
        }
    }

    return Object.values(games).sort((a, b) => b.score - a.score)
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
export function buildFriendGroupFavorites(byHour, limit = LOCAL_ROW_LIMIT) {
    return aggregateFriendPopularity(byHour)
        .slice(0, limit)
        .map(game => ({
            appid:            game.gameid,
            name:             game.name,
            thumbnail:        steamCapsule(game.gameid),
            playtime_forever: 0,
            reason:           game.peakFriends === 1
                ? '1 friend has been playing this'
                : `Up to ${game.peakFriends} friends playing at once`,
        }))
}

// Same popularity source, but only for games the user does not own. Hidden when
// there is too little data so the dashboard does not show a weak row.
export function buildFriendNotOwned(byHour, ownedSet = new Set(), limit = LOCAL_ROW_LIMIT) {
    const results = aggregateFriendPopularity(byHour, { excludeOwned: ownedSet })
        .slice(0, limit)
        .map(game => ({
            appid:            game.gameid,
            name:             game.name,
            thumbnail:        steamCapsule(game.gameid),
            playtime_forever: 0,
            reason:           'Your friends play this — not in your library',
        }))

    return results.length >= MIN_FRIEND_NOT_OWNED_RESULTS ? results : []
}
