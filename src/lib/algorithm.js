import { get } from 'svelte/store'
import { db, clearSuggestionCache } from '$lib/data'
import { getTopGenres } from '$lib/insights'
import { makeStoreThumbnail, getGenreNames } from '$lib/steam-media'
import { steamAPI } from '$lib/steam'

class Brain {
    #data = { liked: [], disliked: [] }

    import(saved) {
        if (saved?.liked && saved?.disliked) this.#data = { ...saved }
    }

    export() {
        return { ...this.#data }
    }

    toSets() {
        return {
            liked: new Set(this.#data.liked),
            disliked: new Set(this.#data.disliked),
        }
    }

    hasData() {
        return this.#data.liked.length > 0 || this.#data.disliked.length > 0
    }

    record(game, liked) {
        const list = liked ? this.#data.liked : this.#data.disliked
        if (!list.includes(game.name)) list.unshift(game.name)
        if (list.length > 25) list.length = 25
    }

    reset() {
        this.#data = { liked: [], disliked: [] }
    }
}

function getSuggestionTTL() {
    const hours = get(db).prefs?.suggestions?.refreshHours ?? 24
    return hours * 60 * 60 * 1000
}

function isFresh(bucket) {
    return !!bucket?.expiresAt && bucket.expiresAt > Date.now()
}

function promiseFromApi(run) {
    return new Promise((resolve, reject) => {
        try {
            const result = run(resolve)
            if (result instanceof Promise) result.catch(reject)
        } catch (error) {
            reject(error)
        }
    })
}

function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)))
}

function buildProfileSummary(state) {
    const details = state.cache?.library?.details ?? {}
    const playtime = state.cache?.library?.playtime ?? {}
    const recent = state.cache?.recentlyPlayed?.data ?? []
    const topGenres = getTopGenres(playtime, details, 5)
        .map((genre) => `${genre.genre}:${genre.hours}h`)
        .join(', ')
    const recentGames = recent
        .slice(0, 4)
        .map((game) => `${game.name}:${Math.round((game.playtime_2weeks ?? 0) / 60)}h`)
        .join(', ')

    return [
        `Top genres: ${topGenres || 'unknown'}`,
        `Recent games: ${recentGames || 'none'}`,
        `Preferred genres: ${(state.prefs?.genres?.preferred ?? []).join(', ') || 'none'}`,
        `Avoid genres: ${(state.prefs?.genres?.excluded ?? []).join(', ') || 'none'}`,
    ].join('\n')
}

function buildGenreWeightMap(state) {
    const details = state.cache?.library?.details ?? {}
    const playtime = state.cache?.library?.playtime ?? {}
    const weights = new Map()

    for (const [appid, minutes] of Object.entries(playtime)) {
        if ((minutes ?? 0) <= 0 || !details[appid]?.data) continue

        const genres = getGenreNames(details[appid].data.genres)
        for (const genre of genres) {
            weights.set(genre, (weights.get(genre) ?? 0) + minutes)
        }
    }

    return weights
}

function fallbackPlayReason(game, signals) {
    if (signals.preferredMatch.length > 0) {
        return `It lines up with your preferred ${signals.preferredMatch[0]} taste and is still sitting underplayed in your library.`
    }

    if (signals.genreMatch.length > 0) {
        return `It matches the ${signals.genreMatch[0]} games you spend the most time in and gives your backlog a strong next pick.`
    }

    if (signals.lowPlaytime) {
        return `You already own it, but you have barely touched it compared with the rest of your library.`
    }

    return `It fits the shape of your library and gives you a reliable next game without buying something new.`
}

function fallbackBuyReason(game, signals) {
    if (signals.friendCount > 0) {
        return `${signals.friendCount} of your friends are active around it, and it overlaps with the genres you play most.`
    }

    if (signals.preferredMatch.length > 0) {
        return `It leans into your preferred ${signals.preferredMatch[0]} taste and looks like a good store-side match for your library.`
    }

    if (signals.discount > 0) {
        return `It fits your library profile and it is discounted right now, which makes it an easy pick to watch or grab.`
    }

    return `It overlaps with the games and genres you already stick with, so it is a strong candidate when you want something new.`
}

function buildOwnedCandidates(state, brain) {
    const appIdList = state.cache?.library?.appIdList ?? []
    const details = state.cache?.library?.details ?? {}
    const playtime = state.cache?.library?.playtime ?? {}
    const recentIds = new Set((state.cache?.recentlyPlayed?.data ?? []).map((game) => Number(game.appid)))
    const preferred = new Set(state.prefs?.genres?.preferred ?? [])
    const excluded = new Set(state.prefs?.genres?.excluded ?? [])
    const genreWeights = buildGenreWeightMap(state)
    const brainState = brain.toSets()

    return appIdList
        .map((appid) => ({
            appid,
            playtime: playtime[appid] ?? 0,
            game: details[appid]?.data ?? null,
        }))
        .filter((entry) => entry.game)
        .filter((entry) => !brainState.disliked.has(entry.game.name))
        .map((entry) => {
            const genres = getGenreNames(entry.game.genres)
            const genreMatch = genres.filter((genre) => genreWeights.has(genre))
            const preferredMatch = genres.filter((genre) => preferred.has(genre))
            const excludedMatch = genres.filter((genre) => excluded.has(genre))
            const hours = Math.round(entry.playtime / 60)
            const lowPlaytime = hours === 0 || hours < 12

            let score = 30
            score += genreMatch.reduce((total, genre) => total + Math.min(14, Math.round((genreWeights.get(genre) ?? 0) / 240)), 0)
            score += preferredMatch.length * 12
            score -= excludedMatch.length * 40
            score += lowPlaytime ? 18 : Math.max(0, 10 - Math.round(hours / 4))
            score -= recentIds.has(Number(entry.appid)) ? 18 : 0
            score += brainState.liked.has(entry.game.name) ? 10 : 0

            const signals = {
                genreMatch,
                preferredMatch,
                excludedMatch,
                lowPlaytime,
            }

            return {
                sourceType: 'owned',
                heuristicScore: clampScore(score),
                heuristicSignals: signals,
                aiReason: null,
                reason: fallbackPlayReason(entry.game, signals),
                playtime: entry.playtime,
                game: entry.game,
            }
        })
        .filter((item) => item.heuristicScore > 0)
        .sort((left, right) => right.heuristicScore - left.heuristicScore)
}

async function fetchStoreDetails(appid) {
    const payload = await promiseFromApi((resolve) => steamAPI.getGameDetails(appid, resolve))
    return payload?.[appid]?.data ?? null
}

function buildStoreCandidateMap(state) {
    const owned = new Set((state.cache?.library?.appIdList ?? []).map((appid) => Number(appid)))
    const buckets = new Map()

    const friends = state.cache?.friends?.data ?? []
    for (const friend of friends) {
        if (!friend.gameid) continue
        const appid = Number(friend.gameid)
        if (owned.has(appid)) continue
        const entry = buckets.get(appid) ?? {
            appid,
            name: friend.gameextrainfo ?? `App ${appid}`,
            sourceLabel: 'Friends playing',
            friendNames: [],
            featuredDiscount: 0,
        }
        entry.friendNames.push(friend.personaname)
        buckets.set(appid, entry)
    }

    return buckets
}

async function buildStoreCandidates(state, brain) {
    const preferred = new Set(state.prefs?.genres?.preferred ?? [])
    const excluded = new Set(state.prefs?.genres?.excluded ?? [])
    const genreWeights = buildGenreWeightMap(state)
    const brainState = brain.toSets()
    const buckets = buildStoreCandidateMap(state)

    try {
        const featured = await promiseFromApi((resolve) => steamAPI.getFeaturedGames(resolve))
        const featuredGroups = [
            { label: 'Hot right now', items: featured?.top_sellers?.items ?? [] },
            { label: 'Worth buying', items: featured?.specials?.items ?? [] },
        ]

        for (const group of featuredGroups) {
            for (const item of group.items.slice(0, 12)) {
                const appid = Number(item.id)
                if (!appid || buckets.has(appid)) {
                    if (buckets.has(appid)) {
                        buckets.get(appid).featuredDiscount = Math.max(
                            buckets.get(appid).featuredDiscount,
                            item.discount_percent ?? 0,
                        )
                    }
                    continue
                }

                buckets.set(appid, {
                    appid,
                    name: item.name ?? `App ${appid}`,
                    sourceLabel: group.label,
                    friendNames: [],
                    featuredDiscount: item.discount_percent ?? 0,
                })
            }
        }
    } catch (error) {
        console.warn('[Algorithm] Featured games unavailable:', error)
    }

    const candidateList = [...buckets.values()]
        .filter((candidate) => !brainState.disliked.has(candidate.name))
        .slice(0, 18)

    const hydrated = await Promise.all(candidateList.map(async (candidate) => {
        try {
            const detail = await fetchStoreDetails(candidate.appid)
            if (!detail) return null

            const genres = getGenreNames(detail.genres)
            const preferredMatch = genres.filter((genre) => preferred.has(genre))
            const excludedMatch = genres.filter((genre) => excluded.has(genre))
            const genreMatch = genres.filter((genre) => genreWeights.has(genre))
            const friendCount = candidate.friendNames.length
            const discount = detail.price_overview?.discount_percent ?? candidate.featuredDiscount ?? 0

            let score = 26
            score += genreMatch.reduce((total, genre) => total + Math.min(12, Math.round((genreWeights.get(genre) ?? 0) / 280)), 0)
            score += preferredMatch.length * 10
            score -= excludedMatch.length * 40
            score += friendCount * 12
            score += Math.min(12, discount / 4)
            score += brainState.liked.has(detail.name) ? 8 : 0

            const price = detail.price_overview?.final_formatted ?? (detail.is_free ? 'Free' : null)
            const thumbnail = detail.header_image ?? detail.capsule_image ?? makeStoreThumbnail(candidate.appid)

            const signals = {
                friendCount,
                preferredMatch,
                excludedMatch,
                genreMatch,
                discount,
            }

            return {
                sourceType: candidate.friendNames.length > 0 ? 'friend' : 'store',
                sourceLabel: candidate.sourceLabel,
                heuristicScore: clampScore(score),
                heuristicSignals: signals,
                aiReason: null,
                reason: fallbackBuyReason(detail, signals),
                appid: candidate.appid,
                name: detail.name,
                price,
                thumbnail,
                storeData: {
                    is_free: detail.is_free ?? false,
                    price: detail.price_overview ? { final_formatted: detail.price_overview.final_formatted } : null,
                },
                game: {
                    steam_appid: detail.steam_appid,
                    name: detail.name,
                    thumbnail,
                    header_image: detail.header_image ?? null,
                    genres: (detail.genres ?? []).map((genre) => ({ description: genre.description })),
                    developers: detail.developers ?? [],
                    release_date: detail.release_date ?? null,
                },
            }
        } catch (error) {
            console.warn(`[Algorithm] Could not hydrate store candidate ${candidate.appid}:`, error)
            return null
        }
    }))

    return hydrated
        .filter(Boolean)
        .filter((item) => item.heuristicScore > 0)
        .sort((left, right) => right.heuristicScore - left.heuristicScore)
}

async function fetchAIReasons(type, profile, items) {
    const response = await fetch('/api/sage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            profile,
            candidates: items.map((item) => ({
                id: item.game?.steam_appid ?? item.appid,
                name: item.game?.name ?? item.name,
                genres: getGenreNames(item.game?.genres),
                score: item.heuristicScore,
                sourceLabel: item.sourceLabel ?? item.sourceType,
            })),
        }),
    })

    if (!response.ok) throw new Error(`/api/sage returned ${response.status}`)

    const payload = await response.json()
    const reasons = new Map()
    for (const item of payload?.reasons ?? []) {
        reasons.set(Number(item.id), item.reason)
    }
    return reasons
}

export class Algorithm {
    #brain = new Brain()

    constructor() {
        const saved = get(db).algr?.brain
        if (saved) this.#brain.import(saved)
    }

    #persistBrain() {
        db.update((state) => {
            state.algr ??= {}
            state.algr.brain = this.#brain.export()
            return state
        })
    }

    #cacheBucket(type) {
        return get(db).cache?.suggestions?.[type] ?? null
    }

    #persistCache(type, items) {
        const generatedAt = Date.now()
        const expiresAt = generatedAt + getSuggestionTTL()

        db.update((state) => {
            state.cache ??= {}
            state.cache.suggestions ??= {}
            state.cache.suggestions[type] = {
                generatedAt,
                expiresAt,
                items,
            }
            return state
        })
    }

    async getPlaySuggestions() {
        const cached = this.#cacheBucket('play')
        if (isFresh(cached) && cached.items?.length) return cached.items

        const state = get(db)
        const maxResults = state.prefs?.suggestions?.maxResults ?? 8
        const items = buildOwnedCandidates(state, this.#brain).slice(0, maxResults)

        if (items.length === 0) return []

        try {
            const reasons = await fetchAIReasons('play', buildProfileSummary(state), items)
            items.forEach((item) => {
                const aiReason = reasons.get(Number(item.game.steam_appid))
                if (aiReason) {
                    item.aiReason = aiReason
                    item.reason = aiReason
                }
            })
        } catch (error) {
            console.warn('[Algorithm] AI play explanations unavailable:', error)
        }

        this.#persistCache('play', items)
        return items
    }

    async getBuySuggestions() {
        const cached = this.#cacheBucket('buy')
        if (isFresh(cached) && cached.items?.length) return cached.items

        const state = get(db)
        const maxResults = state.prefs?.suggestions?.maxResults ?? 8
        const items = (await buildStoreCandidates(state, this.#brain)).slice(0, maxResults)

        if (items.length === 0) return []

        try {
            const reasons = await fetchAIReasons('buy', buildProfileSummary(state), items)
            items.forEach((item) => {
                const aiReason = reasons.get(Number(item.appid))
                if (aiReason) {
                    item.aiReason = aiReason
                    item.reason = aiReason
                }
            })
        } catch (error) {
            console.warn('[Algorithm] AI buy explanations unavailable:', error)
        }

        this.#persistCache('buy', items)
        return items
    }

    recordInteraction(game, liked) {
        this.#brain.record(game, liked)
        this.#persistBrain()
        this.invalidate('all')
    }

    invalidate(type = 'all') {
        clearSuggestionCache(type)
    }

    resetFeedback() {
        this.#brain.reset()
        this.#persistBrain()
        this.invalidate('all')
    }
}
