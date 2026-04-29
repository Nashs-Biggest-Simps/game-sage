const LOCAL_ROW_LIMIT = 12
const MOST_PLAYED_LIMIT = 12

export function genreNames(game) {
    return (game?.genres ?? []).map(g => g.description).filter(Boolean)
}

export function hasExcludedGenre(game, excluded) {
    if (!excluded.length) return false
    const genres = genreNames(game).map(g => g.toLowerCase())
    return excluded.some(g => genres.includes(g.toLowerCase()))
}

export function buildLibraryGames(details, playtime, blacklist = new Set()) {
    return Object.entries(details)
        .map(([id, entry]) => {
            const game = entry?.data
            if (!game?.steam_appid) return null
            if (blacklist.has(String(id)) || blacklist.has(String(game.steam_appid))) return null
            return {
                game,
                playtime: playtime[id] ?? playtime[game.steam_appid] ?? 0,
            }
        })
        .filter(Boolean)
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
    const preferredLower = preferred.map(g => g.toLowerCase())
    const preferredMatch = genres.find(g => preferredLower.includes(g.toLowerCase()))
    if (preferredMatch) return preferredMatch

    return genres
        .map(g => ({ genre: g, weight: weights.get(g) ?? 0 }))
        .sort((a, b) => b.weight - a.weight)[0]?.genre ?? null
}

// Algorithm: Score each unplayed game by how closely it matches the genres
// the user has actually spent time in. Steps:
//   1. Build a genre weight map from all played games (hours per genre).
//   2. Filter to non-DLC, non-excluded games.
//   3. Score each by summing the genre weights of all its genres, plus a
//      proportional boost for any genres the user has explicitly preferred.
//      The preferred boost scales with the user's heaviest genre so it stays
//      meaningful regardless of total playtime.
//   4. Add a Metacritic quality bump (when present) to break ties toward
//      critically respected titles. Unplayed games are preferred, then the row
//      backfills with low-playtime games when the unplayed pool is small.
//   5. Sort by score, then cap any single primary genre at the row limit so
//      smaller or genre-heavy libraries can still fill the dashboard row.
export function buildLocalLibrarySuggestions(games, preferred, excluded) {
    const weights      = buildGenreWeights(games)
    const maxWeight    = Math.max(...weights.values(), 1)
    const preferredLow = preferred.map(g => g.toLowerCase())
    const genreCap     = {}

    return games
        .filter(({ game, playtime }) => {
            if (game.type === 'dlc' || game.type === 'demo') return false
            return !hasExcludedGenre(game, excluded)
        })
        .map(({ game, playtime }) => {
            const match  = topGenreMatch(game, weights, preferred)
            const genres = genreNames(game)
            const primaryGenre = genres[0] ?? 'Other'

            const genreScore = genres.reduce((sum, g) => {
                const boost = preferredLow.includes(g.toLowerCase()) ? maxWeight * 0.5 : 0
                return sum + (weights.get(g) ?? 0) + boost
            }, 0)
            const qualityScore = (game.metacritic_score ?? 0) * (maxWeight / 100)
            const playtimeHours = playtime / 60
            const unplayedBoost = playtime === 0 ? maxWeight * 2 : 0
            const lowPlaytimeBoost = playtime > 0 ? Math.max(0, maxWeight - Math.log(playtimeHours + 1) * 20) : 0

            return {
                game,
                score: genreScore + qualityScore + unplayedBoost + lowPlaytimeBoost,
                primaryGenre,
                reason: playtime === 0
                    ? (match ? `Matches your ${match} playtime` : 'Unplayed in your library')
                    : (match ? `Low-playtime ${match} pick from your library` : 'Worth another look from your library'),
            }
        })
        .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
        .filter(item => {
            genreCap[item.primaryGenre] = (genreCap[item.primaryGenre] ?? 0) + 1
            return genreCap[item.primaryGenre] <= LOCAL_ROW_LIMIT
        })
        .slice(0, LOCAL_ROW_LIMIT)
}

export function buildMostPlayedGames(details, playtime, limit = MOST_PLAYED_LIMIT, blacklist = new Set()) {
    return buildLibraryGames(details, playtime, blacklist)
        .filter(({ playtime: pt }) => pt > 0)
        .sort((a, b) => b.playtime - a.playtime)
        .slice(0, limit)
        .map(({ game, playtime: pt }) => ({
            appid: game.steam_appid,
            name: game.name,
            thumbnail: game.thumbnail ?? null,
            playtime_forever: pt,
        }))
}

export function buildFriendFavorites(friends, details, playtime) {
    const inGame    = friends.filter(f => f.gameid)
    if (!inGame.length) return []
    const ownedIds  = new Set(Object.keys(playtime).map(String))
    const map       = {}
    for (const f of inGame) {
        const key = String(f.gameid)
        if (!map[key]) {
            const d = details[key]?.data ?? null
            map[key] = {
                appid:            parseInt(key),
                name:             d?.name ?? f.gameextrainfo ?? 'Unknown',
                thumbnail:        d?.thumbnail ?? null,
                playtime_forever: playtime[key] ?? 0,
                owned:            ownedIds.has(key),
                friendCount:      0,
                friendNames:      [],
            }
        }
        map[key].friendCount++
        map[key].friendNames.push(f.personaname)
    }
    return Object.values(map)
        .sort((a, b) => {
            if (a.owned !== b.owned) return a.owned ? -1 : 1
            return b.friendCount - a.friendCount
        })
        .slice(0, 12)
        .map(g => ({
            ...g,
            reason: g.friendCount === 1
                ? `${g.friendNames[0]} is playing right now`
                : `${g.friendCount} friends playing right now`,
        }))
}

export function buildHiddenGems(games, preferred, excluded, skip = 12) {
    const weights        = buildGenreWeights(games)
    const preferredLower = preferred.map(g => g.toLowerCase())

    return games
        .filter(({ game, playtime }) => playtime === 0 && !hasExcludedGenre(game, excluded))
        .map(({ game }) => {
            const match  = topGenreMatch(game, weights, preferred)
            const genres = genreNames(game)
            const score  = genres.reduce((sum, genre) => {
                return sum + (weights.get(genre) ?? 0) + (preferredLower.includes(genre.toLowerCase()) ? 500 : 0)
            }, 0)
            return {
                game,
                score,
                reason: match
                    ? `Buried gem — matches your ${match} playtime`
                    : 'Buried in your library, worth a look',
            }
        })
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
        .slice(skip, skip + LOCAL_ROW_LIMIT)
}

export function buildGenreSpotlight(games, targetGenre, excluded) {
    if (!targetGenre) return []
    const weights     = buildGenreWeights(games)
    const targetLower = targetGenre.toLowerCase()

    return games
        .filter(({ game, playtime }) =>
            playtime === 0 &&
            !hasExcludedGenre(game, excluded) &&
            genreNames(game).some(g => g.toLowerCase() === targetLower)
        )
        .map(({ game }) => ({
            appid:            game.steam_appid,
            name:             game.name,
            thumbnail:        game.thumbnail ?? null,
            playtime_forever: 0,
            score:            genreNames(game).reduce((sum, g) => sum + (weights.get(g) ?? 0), 0),
            reason:           `${targetGenre} · unplayed in your library`,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, LOCAL_ROW_LIMIT)
}

// Aggregate all friendPopularity buckets into a ranked list of games.
// Used by the "Trending in Your Circle" row — shows what friend groups
// have collectively spent the most time playing over the stored window.
export function buildFriendGroupFavorites(byHour, limit = 12) {
    if (!byHour || !Object.keys(byHour).length) return []
    const map = {}
    for (const bucket of Object.values(byHour)) {
        for (const [gameid, { name, peak }] of Object.entries(bucket)) {
            if (!map[gameid]) map[gameid] = { gameid: parseInt(gameid), name, score: 0, peakFriends: 0 }
            map[gameid].score      += peak
            map[gameid].peakFriends = Math.max(map[gameid].peakFriends, peak)
        }
    }
    return Object.values(map)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(g => ({
            appid:            g.gameid,
            name:             g.name,
            thumbnail:        `https://cdn.akamai.steamstatic.com/steam/apps/${g.gameid}/capsule_616x353.jpg`,
            playtime_forever: 0,
            reason:           g.peakFriends === 1
                ? '1 friend has been playing this'
                : `Up to ${g.peakFriends} friends playing at once`,
        }))
}

// Same aggregation but filtered to games NOT in the user's library.
// Hidden when fewer than 4 results so the row only appears with meaningful data.
export function buildFriendNotOwned(byHour, ownedSet = new Set(), limit = 12) {
    if (!byHour || !Object.keys(byHour).length) return []
    const map = {}
    for (const bucket of Object.values(byHour)) {
        for (const [gameid, { name, peak }] of Object.entries(bucket)) {
            if (ownedSet.has(gameid) || ownedSet.has(String(gameid)) || ownedSet.has(parseInt(gameid))) continue
            if (!map[gameid]) map[gameid] = { gameid: parseInt(gameid), name, score: 0, peakFriends: 0 }
            map[gameid].score      += peak
            map[gameid].peakFriends = Math.max(map[gameid].peakFriends, peak)
        }
    }
    const results = Object.values(map)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(g => ({
            appid:            g.gameid,
            name:             g.name,
            thumbnail:        `https://cdn.akamai.steamstatic.com/steam/apps/${g.gameid}/capsule_616x353.jpg`,
            playtime_forever: 0,
            reason:           'Your friends play this — not in your library',
        }))
    return results.length >= 4 ? results : []
}

export function buildNoAiSuggestions(games, librarySuggestions, preferred, excluded) {
    const used = new Set(librarySuggestions.map(item => item.game?.steam_appid))
    const weights = buildGenreWeights(games)

    return games
        .filter(({ game }) => !used.has(game.steam_appid) && !hasExcludedGenre(game, excluded))
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
        .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
        .slice(0, LOCAL_ROW_LIMIT)
}
