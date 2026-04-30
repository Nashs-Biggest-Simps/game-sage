import { get } from 'svelte/store'
import { db } from '$lib/data'
import { buildCompactProfile, buildBuyProfile, getGameDetail, resolveThumbnail } from '$lib/cache'
import { buildLibraryGames, buildLocalLibrarySuggestions } from '$lib/suggestions'
import { steamAPI } from '$lib/steam'

const DEFAULT_REFRESH_HOURS = 24
const MIN_PLAYED_GAMES = 3
const MIN_UNPLAYED_GAMES = 1
const MIN_RESULTS = 8
const MAX_RESULTS = 12
const STORE_MATCH_LIMIT = 16
const MAX_FEEDBACK_ITEMS = 30

const inFlightRequests = {
    play: null,
    buy: null,
}

function state() {
    return get(db)
}

function prefs() {
    return state().prefs ?? {}
}

function clampResultLimit(value) {
    const n = Number(value ?? MAX_RESULTS)
    if (!Number.isFinite(n)) return MAX_RESULTS
    return Math.max(MIN_RESULTS, Math.min(MAX_RESULTS, n))
}

function preferredResultLimit() {
    return clampResultLimit(prefs().suggestions?.maxResults)
}

function suggestionTTL() {
    const hours = Number(prefs().suggestions?.refreshHours ?? DEFAULT_REFRESH_HOURS)
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_REFRESH_HOURS
    return safeHours * 60 * 60 * 1000
}

function cacheIsFresh(generatedAt) {
    return !!generatedAt && (Date.now() - generatedAt) < suggestionTTL()
}

function uniqueBy(items, keyFn) {
    const seen = new Set()

    return items.filter(item => {
        const key = keyFn(item)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function ownedAppIds() {
    return new Set((state().cache?.library?.appIdList ?? []).map(id => String(id)))
}

function slimStoreData(storeGame) {
    if (!storeGame) return null

    return {
        is_free: storeGame.is_free ?? false,
        price: storeGame.price ? {
            final_formatted: storeGame.price.final_formatted,
        } : null,
    }
}

function searchSteamStoreByName(name) {
    return new Promise(resolve => {
        steamAPI.searchStore(name, data => {
            const items = data?.items ?? []
            const exactMatch = items.find(item => item.name?.toLowerCase() === name.toLowerCase())
            resolve(exactMatch ?? items[0] ?? null)
        })
    })
}

// Stores explicit like/dislike feedback and injects it into future AI prompts.
class SuggestionFeedback {
    #data = { liked: [], disliked: [] }

    import(saved) {
        if (!saved?.liked || !saved?.disliked) return
        this.#data = {
            liked: [...saved.liked],
            disliked: [...saved.disliked],
        }
    }

    export() {
        return {
            liked: [...this.#data.liked],
            disliked: [...this.#data.disliked],
        }
    }

    hasData() {
        return this.#data.liked.length > 0 || this.#data.disliked.length > 0
    }

    toPromptSection() {
        const lines = []
        if (this.#data.liked.length) lines.push(`User enjoyed: ${this.#data.liked.join(', ')}`)
        if (this.#data.disliked.length) lines.push(`User disliked: ${this.#data.disliked.join(', ')}`)
        return lines.join('\n')
    }

    record(game, liked) {
        const name = game?.name
        if (!name) return

        const target = liked ? this.#data.liked : this.#data.disliked
        if (target.includes(name)) return

        target.push(name)
        if (target.length > MAX_FEEDBACK_ITEMS) target.shift()
    }

    reset() {
        this.#data = { liked: [], disliked: [] }
    }
}

export class Algorithm {
    #feedback = new SuggestionFeedback()

    constructor() {
        this.#feedback.import(state().algr?.brain)
    }

    #feedbackPrompt() {
        return this.#feedback.hasData() ? this.#feedback.toPromptSection() : null
    }

    #saveFeedback() {
        db.update(data => {
            data.algr ??= {}
            data.algr.brain = this.#feedback.export()
            return data
        })
    }

    #cached(type) {
        return state().cache?.suggestions?.[type] ?? null
    }

    #hasUsableCache(cached) {
        const requiredCount = Math.min(MIN_RESULTS, preferredResultLimit())
        return cacheIsFresh(cached?.generatedAt) && cached.items?.length >= requiredCount
    }

    #saveCache(type, items) {
        db.update(data => {
            data.cache ??= {}
            data.cache.suggestions ??= {}
            data.cache.suggestions[type] = { items, generatedAt: Date.now() }
            return data
        })
    }

    async #requestAiSuggestions(type, profileText) {
        const res = await fetch('/api/ai-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                profile: profileText,
                prefs: prefs(),
            }),
        })

        if (!res.ok) throw new Error(`/api/ai-suggestions returned ${res.status}`)
        return res.json()
    }

    #localPlayBackfill(existing = []) {
        const current = state()
        const details = current.cache?.library?.details ?? {}
        const playtime = current.cache?.library?.playtime ?? {}
        const blacklist = new Set((current.cache?.library?.blacklist ?? []).map(String))
        const userPrefs = current.prefs ?? {}

        const libraryGames = buildLibraryGames(details, playtime, blacklist)
        const ranked = buildLocalLibrarySuggestions(
            libraryGames,
            userPrefs.genres?.preferred ?? [],
            userPrefs.genres?.excluded ?? [],
        )

        const used = new Set(existing.map(item => String(item.game?.steam_appid)))

        return ranked
            .filter(({ game }) => !used.has(String(game.steam_appid)))
            .map(({ game, reason }) => ({ game, reason }))
    }

    #resolvePlayResults(rawItems, limit) {
        const aiItems = rawItems
            .map(({ id, r: reason }) => {
                const game = getGameDetail(id)
                return game ? { game, reason } : null
            })
            .filter(Boolean)

        return uniqueBy(
            [...aiItems, ...this.#localPlayBackfill(aiItems)],
            item => String(item.game?.steam_appid),
        ).slice(0, limit)
    }

    async #resolveBuyResults(rawItems, cachedItems, limit) {
        const owned = ownedAppIds()
        const resolved = await Promise.all(
            rawItems.slice(0, STORE_MATCH_LIMIT).map(async ({ n: name, r: reason }) => {
                const match = await searchSteamStoreByName(name)
                if (!match || owned.has(String(match.id))) return null

                return {
                    name,
                    reason,
                    appid: match.id,
                    storeData: slimStoreData(match),
                    thumbnail: resolveThumbnail(match.id),
                }
            })
        )

        return uniqueBy(
            [...(cachedItems ?? []), ...resolved.filter(Boolean)],
            item => String(item.appid),
        ).slice(0, limit)
    }

    // Returns [{ game, reason }] for owned games the user should play next.
    async getPlaySuggestions() {
        const cached = this.#cached('play')
        const limit = preferredResultLimit()

        if (this.#hasUsableCache(cached)) return cached.items.slice(0, limit)
        if (inFlightRequests.play) return inFlightRequests.play

        inFlightRequests.play = (async () => {
            const profile = buildCompactProfile(this.#feedbackPrompt())

            if (profile.playedCount < MIN_PLAYED_GAMES || profile.unplayedCount < MIN_UNPLAYED_GAMES) {
                console.warn(`[Algorithm] Not enough data for play suggestions (played=${profile.playedCount}, unplayed=${profile.unplayedCount})`)
                return cached?.items ?? []
            }

            try {
                const { s: rawItems } = await this.#requestAiSuggestions('play', profile.text)
                if (!Array.isArray(rawItems)) throw new Error('Unexpected play response shape')

                const items = this.#resolvePlayResults(rawItems, limit)
                this.#saveCache('play', items)
                return items
            } catch (err) {
                console.error('[Algorithm] getPlaySuggestions failed:', err)

                const fallback = uniqueBy(
                    [...(cached?.items ?? []), ...this.#localPlayBackfill()],
                    item => String(item.game?.steam_appid),
                ).slice(0, limit)

                this.#saveCache('play', fallback)
                return fallback
            } finally {
                inFlightRequests.play = null
            }
        })()

        return inFlightRequests.play
    }

    // Returns [{ name, reason, appid, thumbnail, storeData }] for games not owned.
    async getBuySuggestions() {
        const cached = this.#cached('buy')
        const limit = preferredResultLimit()

        if (this.#hasUsableCache(cached)) return cached.items.slice(0, limit)
        if (inFlightRequests.buy) return inFlightRequests.buy

        inFlightRequests.buy = (async () => {
            const profile = buildBuyProfile(this.#feedbackPrompt())

            if (profile.playedCount < MIN_PLAYED_GAMES) {
                console.warn(`[Algorithm] Not enough data for buy suggestions (played=${profile.playedCount})`)
                return cached?.items ?? []
            }

            try {
                const { b: rawItems } = await this.#requestAiSuggestions('buy', profile.text)
                if (!Array.isArray(rawItems)) throw new Error('Unexpected buy response shape')

                const items = await this.#resolveBuyResults(rawItems, cached?.items, limit)
                this.#saveCache('buy', items)
                return items
            } catch (err) {
                console.error('[Algorithm] getBuySuggestions failed:', err)
                return cached?.items ?? []
            } finally {
                inFlightRequests.buy = null
            }
        })()

        return inFlightRequests.buy
    }

    recordInteraction(game, liked) {
        this.#feedback.record(game, liked)
        this.#saveFeedback()
        this.invalidate('all')
    }

    invalidate(type = 'all') {
        db.update(data => {
            const suggestions = data.cache?.suggestions
            if (!suggestions) return data

            if ((type === 'play' || type === 'all') && suggestions.play) suggestions.play.generatedAt = 0
            if ((type === 'buy' || type === 'all') && suggestions.buy) suggestions.buy.generatedAt = 0

            return data
        })
    }

    resetFeedback() {
        this.#feedback.reset()
        this.#saveFeedback()
        this.invalidate('all')
    }

    getBrainState() {
        return this.#feedback.export()
    }
}
