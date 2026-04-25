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

export function buildLibraryGames(details, playtime) {
    return Object.entries(details)
        .map(([id, entry]) => {
            const game = entry?.data
            if (!game?.steam_appid) return null
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

export function buildLocalLibrarySuggestions(games, preferred, excluded) {
    const weights = buildGenreWeights(games)
    const preferredLower = preferred.map(g => g.toLowerCase())

    return games
        .filter(({ game, playtime }) => playtime === 0 && !hasExcludedGenre(game, excluded))
        .map(({ game }) => {
            const match = topGenreMatch(game, weights, preferred)
            const genres = genreNames(game)
            const score = genres.reduce((sum, genre) => {
                const preferenceBoost = preferredLower.includes(genre.toLowerCase()) ? 500 : 0
                return sum + (weights.get(genre) ?? 0) + preferenceBoost
            }, 0)

            return {
                game,
                score,
                reason: match
                    ? `Recommended from your library because it matches ${match}.`
                    : 'Recommended from your unplayed library.',
            }
        })
        .sort((a, b) => b.score - a.score || a.game.name.localeCompare(b.game.name))
        .slice(0, LOCAL_ROW_LIMIT)
}

export function buildMostPlayedGames(details, playtime, limit = MOST_PLAYED_LIMIT) {
    return buildLibraryGames(details, playtime)
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
