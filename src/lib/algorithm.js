import { get } from 'svelte/store'
import { db } from '$lib/data'
import { buildCompactProfile, buildBuyProfile, getGameDetail, resolveThumbnail } from '$lib/cache'
import { buildLibraryGames, buildLocalLibrarySuggestions } from '$lib/suggestions'
import { steamAPI } from '$lib/steam'

const SUGGESTION_TTL = 24 * 60 * 60 * 1000
const MIN_PLAYED     = 3
const MIN_UNPLAYED   = 1
const MIN_ROW_ITEMS  = 8
const MAX_ROW_ITEMS  = 12
const inFlight = { play: null, buy: null }

// Lightweight feedback tracker — stores liked/disliked game names
// to pass as context to the AI on subsequent requests.
class Brain {
    #data = { liked: [], disliked: [] }

    import(saved) {
        if (saved?.liked && saved?.disliked) this.#data = { ...saved }
    }

    export() { return { ...this.#data } }

    hasData() {
        return !!(this.#data.liked.length || this.#data.disliked.length)
    }

    toPromptString() {
        const parts = []
        if (this.#data.liked.length)    parts.push(`User enjoyed: ${this.#data.liked.join(', ')}`)
        if (this.#data.disliked.length) parts.push(`User disliked: ${this.#data.disliked.join(', ')}`)
        return parts.join('\n')
    }

    record({ name }, liked) {
        const list = liked ? this.#data.liked : this.#data.disliked
        if (!list.includes(name)) {
            list.push(name)
            if (list.length > 30) list.shift()
        }
    }

    reset() { this.#data = { liked: [], disliked: [] } }
}

function isFresh(ts) {
    return !!ts && (Date.now() - ts) < SUGGESTION_TTL
}

function searchStore(name) {
    return new Promise(resolve => {
        steamAPI.searchStore(name, data => {
            const items = data?.items ?? []
            const exact = items.find(i => i.name?.toLowerCase() === name.toLowerCase())
            resolve(exact ?? items[0] ?? null)
        })
    })
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

// Keep only the fields BuyCard needs to avoid bloating the suggestions cache
function slimStoreData(s) {
    if (!s) return null
    return {
        is_free: s.is_free ?? false,
        price:   s.price ? { final_formatted: s.price.final_formatted } : null,
    }
}

export class Algorithm {
    #brain = new Brain()

    constructor() {
        const saved = get(db).algr?.brain
        if (saved) this.#brain.import(saved)
    }

    #saveBrain() {
        db.update(data => {
            data.algr ??= {}
            data.algr.brain = this.#brain.export()
            return data
        })
    }

    #getCache(type) {
        return get(db).cache?.suggestions?.[type] ?? null
    }

    #isUsableCache(cached) {
        return isFresh(cached?.generatedAt) && cached.items?.length >= MIN_ROW_ITEMS
    }

    #persistCache(type, items) {
        db.update(data => {
            data.cache ??= {}
            data.cache.suggestions ??= {}
            data.cache.suggestions[type] = { items, generatedAt: Date.now() }
            return data
        })
    }

    async #callSage(type, profile) {
        const prefs = get(db).prefs ?? {}
        const res = await fetch('/api/sage', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ type, profile, prefs }),
        })
        if (!res.ok) throw new Error(`/api/sage returned ${res.status}`)
        return res.json()
    }

    #playBackfill(existing = []) {
        const state = get(db)
        const details = state.cache?.library?.details ?? {}
        const playtime = state.cache?.library?.playtime ?? {}
        const blacklist = new Set((state.cache?.library?.blacklist ?? []).map(String))
        const prefs = state.prefs ?? {}
        const games = buildLibraryGames(details, playtime, blacklist)
        const ranked = buildLocalLibrarySuggestions(
            games,
            prefs.genres?.preferred ?? [],
            prefs.genres?.excluded ?? []
        )

        const used = new Set(existing.map(item => String(item.game?.steam_appid)))
        return ranked
            .filter(({ game }) => !used.has(String(game.steam_appid)))
            .map(({ game, reason }) => ({ game, reason }))
    }

    // Returns [{ game, reason }] — games from the user's unplayed library.
    // Items are persisted as fully-resolved objects so they load from cache
    // without depending on the detail cache being populated.
    async getPlaySuggestions() {
        const cached = this.#getCache('play')
        if (this.#isUsableCache(cached)) {
            return cached.items.slice(0, MAX_ROW_ITEMS)
        }
        if (inFlight.play) return inFlight.play

        inFlight.play = (async () => {
            const brain = this.#brain.hasData() ? this.#brain.toPromptString() : null
            const { text, playedCount, unplayedCount } = buildCompactProfile(brain)

            if (playedCount < MIN_PLAYED || unplayedCount < MIN_UNPLAYED) {
                console.warn(`[Algorithm] Not enough data for play suggestions (played=${playedCount}, unplayed=${unplayedCount})`)
                return cached?.items ?? []
            }

            try {
                const { s: raw } = await this.#callSage('play', text)
                if (!Array.isArray(raw)) throw new Error('Unexpected response shape')

                // Resolve each appid to its cached game object immediately so the
                // persisted items are self-contained — no detail cache dependency on reload.
                const items = raw.map(({ id, r: reason }) => {
                    const game = getGameDetail(id)
                    return game ? { game, reason } : null
                }).filter(Boolean)
                const filled = uniqueBy([...items, ...this.#playBackfill(items)], item => String(item.game?.steam_appid))
                    .slice(0, MAX_ROW_ITEMS)

                this.#persistCache('play', filled)
                return filled
            } catch (err) {
                console.error('[Algorithm] getPlaySuggestions failed:', err)
                const fallback = uniqueBy([...(cached?.items ?? []), ...this.#playBackfill()], item => String(item.game?.steam_appid))
                    .slice(0, MAX_ROW_ITEMS)
                this.#persistCache('play', fallback)
                return fallback
            } finally {
                inFlight.play = null
            }
        })()

        return inFlight.play
    }

    // Returns [{ name, reason, appid, storeData }] — games not yet owned.
    // storeData is slimmed to only the fields BuyCard reads.
    async getBuySuggestions() {
        const cached = this.#getCache('buy')
        if (this.#isUsableCache(cached)) {
            return cached.items.slice(0, MAX_ROW_ITEMS)
        }
        if (inFlight.buy) return inFlight.buy

        inFlight.buy = (async () => {
            const brain = this.#brain.hasData() ? this.#brain.toPromptString() : null
            const { text, playedCount } = buildBuyProfile(brain)

            if (playedCount < MIN_PLAYED) {
                console.warn(`[Algorithm] Not enough data for buy suggestions (played=${playedCount})`)
                return cached?.items ?? []
            }

            try {
                const { b: suggestions } = await this.#callSage('buy', text)
                if (!Array.isArray(suggestions)) throw new Error('Unexpected response shape')

                const owned = new Set((get(db).cache?.library?.appIdList ?? []).map(id => String(id)))
                const resolved = await Promise.all(
                    suggestions.slice(0, 16).map(async ({ n: name, r: reason }) => {
                        const match = await searchStore(name)
                        if (!match) return null
                        const appid     = match.id
                        if (owned.has(String(appid))) return null
                        const thumbnail = await resolveThumbnail(appid)
                        return { name, reason, appid, storeData: slimStoreData(match), thumbnail }
                    })
                )

                const items = uniqueBy([...(cached?.items ?? []), ...resolved.filter(Boolean)], item => String(item.appid))
                    .slice(0, MAX_ROW_ITEMS)
                this.#persistCache('buy', items)
                return items
            } catch (err) {
                console.error('[Algorithm] getBuySuggestions failed:', err)
                return cached?.items ?? []
            } finally {
                inFlight.buy = null
            }
        })()

        return inFlight.buy
    }

    // Call when the user explicitly likes or dislikes a suggestion
    recordInteraction(game, liked) {
        this.#brain.record({ name: game.name }, liked)
        this.#saveBrain()
        this.invalidate('all')
    }

    invalidate(type = 'all') {
        db.update(data => {
            const s = data.cache?.suggestions
            if (!s) return data
            if ((type === 'play' || type === 'all') && s.play) s.play.generatedAt = 0
            if ((type === 'buy'  || type === 'all') && s.buy)  s.buy.generatedAt  = 0
            return data
        })
    }

    resetFeedback() {
        this.#brain.reset()
        this.#saveBrain()
        this.invalidate('all')
    }

    getBrainState() { return this.#brain.export() }
}
