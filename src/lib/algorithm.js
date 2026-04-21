// algorithm.js
// by Aaron Meche

import { get } from 'svelte/store'
import { db } from '$lib/data'
import { buildCompactProfile, buildBuyProfile, getGameDetail } from '$lib/cache'
import { steamAPI } from '$lib/steam'
import { Algorithm as Brain } from 'rue-algr'

const PLAY_TTL = 24 * 60 * 60 * 1000
const BUY_TTL  = 24 * 60 * 60 * 1000

const MIN_PLAYED   = 3
const MIN_UNPLAYED = 1

function isFresh(ts, ttl) {
    return !!ts && (Date.now() - ts) < ttl
}

// Wrap steamAPI.searchStore callback in a promise and pick the best name match
function searchStore(name) {
    return new Promise(resolve => {
        steamAPI.searchStore(name, data => {
            const items = data?.items ?? []
            const exact = items.find(i => i.name?.toLowerCase() === name.toLowerCase())
            resolve(exact ?? items[0] ?? null)
        })
    })
}

// Returns true only if the brain has actual interaction data worth sending
function brainHasData(brain) {
    const b = brain.getBrain(false)
    return !!(b.recent_interact?.length || b.shown_positive?.length || b.shown_negative?.length)
}

export class Algorithm {
    #brain

    constructor(id = 'default') {
        this.id = id
        this.#brain = new Brain('game')
        this.#loadBrain()
    }

    #loadBrain() {
        const saved = get(db).algr?.brain
        if (saved) this.#brain.importBrain(saved)
    }

    #saveBrain() {
        db.update(data => {
            if (!data.algr) data.algr = {}
            data.algr.brain = this.#brain.getBrain(false)
            return data
        })
    }

    #getPlayCache() { return get(db).cache?.suggestions?.play ?? null }
    #getBuyCache()  { return get(db).cache?.suggestions?.buy  ?? null }

    #persistPlay(items) {
        db.update(data => {
            data.cache ??= {}
            data.cache.suggestions ??= {}
            data.cache.suggestions.play = { items, generatedAt: Date.now() }
            return data
        })
    }

    #persistBuy(items) {
        db.update(data => {
            data.cache ??= {}
            data.cache.suggestions ??= {}
            data.cache.suggestions.buy = { items, generatedAt: Date.now() }
            return data
        })
    }

    // ─── Play Suggestions ────────────────────────────────────────────────────
    // Returns: [{ game: <Steam detail object>, reason: <string> }, ...]

    async getPlaySuggestions() {
        const cached = this.#getPlayCache()
        if (isFresh(cached?.generatedAt, PLAY_TTL) && cached.items?.length) {
            return this.#resolvePlay(cached.items)
        }

        const brain  = brainHasData(this.#brain) ? this.#brain.getBrain(true) : null
        const { text, playedCount, unplayedCount } = buildCompactProfile(brain)

        if (playedCount < MIN_PLAYED || unplayedCount < MIN_UNPLAYED) {
            console.warn(`[Algorithm] Not enough cached data for play suggestions (played=${playedCount}, unplayed=${unplayedCount})`)
            return []
        }

        try {
            const res = await fetch('/api/sage', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ type: 'play', profile: text }),
            })
            if (!res.ok) throw new Error(`/api/sage ${res.status}`)
            const { s: items } = await res.json()
            if (!Array.isArray(items)) throw new Error('Unexpected response shape')
            this.#persistPlay(items)
            return this.#resolvePlay(items)
        } catch (err) {
            console.error('[Algorithm] getPlaySuggestions failed:', err)
            return []
        }
    }

    #resolvePlay(items) {
        return items.map(item => {
            const id   = item?.id ?? item  // handle both {id,r} objects and legacy plain appids
            const game = getGameDetail(id)
            if (!game) return null
            return { game, reason: item?.r ?? null }
        }).filter(Boolean)
    }

    // ─── Buy Suggestions ─────────────────────────────────────────────────────
    // Returns: [{ name, reason, appid, storeData }, ...]

    async getBuySuggestions() {
        const cached = this.#getBuyCache()
        if (isFresh(cached?.generatedAt, BUY_TTL) && cached.items?.length) {
            return cached.items
        }

        const brain = brainHasData(this.#brain) ? this.#brain.getBrain(true) : null
        const { text, playedCount } = buildBuyProfile(brain)

        if (playedCount < MIN_PLAYED) {
            console.warn(`[Algorithm] Not enough cached data for buy suggestions (played=${playedCount})`)
            return []
        }

        try {
            const res = await fetch('/api/sage', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ type: 'buy', profile: text }),
            })
            if (!res.ok) throw new Error(`/api/sage ${res.status}`)
            const { b: suggestions } = await res.json()
            if (!Array.isArray(suggestions)) throw new Error('Unexpected response shape')

            // Resolve each suggested title to a Steam store entry in parallel
            const resolved = await Promise.all(
                suggestions.map(async ({ n: name, r: reason }) => {
                    const match = await searchStore(name)
                    if (!match) return null
                    return { name, reason, appid: match.id, storeData: match }
                })
            )
            const items = resolved.filter(Boolean)
            this.#persistBuy(items)
            return items
        } catch (err) {
            console.error('[Algorithm] getBuySuggestions failed:', err)
            return []
        }
    }

    // ─── User Feedback ───────────────────────────────────────────────────────
    // Call this when a user explicitly likes or dislikes a game.
    // Invalidates suggestions so the next fetch reflects the new preference.

    recordInteraction(game, liked) {
        this.#brain.recordInteraction(
            { name: game.name, developer: game.developers?.[0] ?? null },
            liked
        )
        this.#saveBrain()
        this.invalidate('all')
        console.log(`[Algorithm] Recorded ${liked ? 'like' : 'dislike'} for "${game.name}"`)
    }

    // ─── Invalidation ────────────────────────────────────────────────────────

    invalidate(type = 'all') {
        db.update(data => {
            const s = data.cache?.suggestions
            if (!s) return data
            if ((type === 'play' || type === 'all') && s.play) s.play.generatedAt = 0
            if ((type === 'buy'  || type === 'all') && s.buy)  s.buy.generatedAt  = 0
            return data
        })
        console.log(`[Algorithm] Invalidated suggestions: ${type}`)
    }

    // Wipe all interaction history and force fresh suggestions
    resetFeedback() {
        this.#brain.resetBrain()
        this.#saveBrain()
        this.invalidate('all')
        console.log('[Algorithm] Brain reset and suggestions invalidated.')
    }

    // ─── Debug ───────────────────────────────────────────────────────────────

    printProfile(type = 'play') {
        const brain = brainHasData(this.#brain) ? this.#brain.getBrain(true) : null
        if (type === 'buy') {
            const { text, playedCount } = buildBuyProfile(brain)
            console.log(`[Algorithm] Buy profile (played=${playedCount}):\n${text}`)
        } else {
            const { text, playedCount, unplayedCount } = buildCompactProfile(brain)
            console.log(`[Algorithm] Play profile (played=${playedCount}, unplayed=${unplayedCount}):\n${text}`)
        }
    }

    getBrainState() { return this.#brain.getBrain(false) }
}
