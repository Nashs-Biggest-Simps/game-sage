import { get } from 'svelte/store'
import { db } from '$lib/data'
import { buildCompactProfile, buildBuyProfile, getGameDetail, resolveThumbnail } from '$lib/cache'
import { steamAPI } from '$lib/steam'

const SUGGESTION_TTL = 24 * 60 * 60 * 1000
const MIN_PLAYED     = 3
const MIN_UNPLAYED   = 1

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

    // Returns [{ game, reason }] — games from the user's unplayed library.
    // Items are persisted as fully-resolved objects so they load from cache
    // without depending on the detail cache being populated.
    async getPlaySuggestions() {
        const cached = this.#getCache('play')
        if (isFresh(cached?.generatedAt) && cached.items?.length) {
            return cached.items
        }

        const brain = this.#brain.hasData() ? this.#brain.toPromptString() : null
        const { text, playedCount, unplayedCount } = buildCompactProfile(brain)

        if (playedCount < MIN_PLAYED || unplayedCount < MIN_UNPLAYED) {
            console.warn(`[Algorithm] Not enough data for play suggestions (played=${playedCount}, unplayed=${unplayedCount})`)
            return []
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

            this.#persistCache('play', items)
            return items
        } catch (err) {
            console.error('[Algorithm] getPlaySuggestions failed:', err)
            return []
        }
    }

    // Returns [{ name, reason, appid, storeData }] — games not yet owned.
    // storeData is slimmed to only the fields BuyCard reads.
    async getBuySuggestions() {
        const cached = this.#getCache('buy')
        if (isFresh(cached?.generatedAt) && cached.items?.length) {
            return cached.items
        }

        const brain = this.#brain.hasData() ? this.#brain.toPromptString() : null
        const { text, playedCount } = buildBuyProfile(brain)

        if (playedCount < MIN_PLAYED) {
            console.warn(`[Algorithm] Not enough data for buy suggestions (played=${playedCount})`)
            return []
        }

        try {
            const { b: suggestions } = await this.#callSage('buy', text)
            if (!Array.isArray(suggestions)) throw new Error('Unexpected response shape')

            const resolved = await Promise.all(
                suggestions.map(async ({ n: name, r: reason }) => {
                    const match = await searchStore(name)
                    if (!match) return null
                    const appid     = match.id
                    const thumbnail = await resolveThumbnail(appid)
                    return { name, reason, appid, storeData: slimStoreData(match), thumbnail }
                })
            )

            const items = resolved.filter(Boolean)
            this.#persistCache('buy', items)
            return items
        } catch (err) {
            console.error('[Algorithm] getBuySuggestions failed:', err)
            return []
        }
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
