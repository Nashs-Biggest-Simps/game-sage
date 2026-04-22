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

    #persistCache(type, ids, reasons) {
        db.update(data => {
            data.cache           ??= {}
            data.cache.suggestions ??= {}
            data.cache.suggestions[type] = { ids, reasons, generatedAt: Date.now() }
            return data
        })
    }

    // Removes game_details entries with source 'buy' that are no longer suggested.
    #cleanupBuyDetails(keepIds) {
        const keepSet = new Set(keepIds.map(String))
        db.update(data => {
            if (!data.game_details) return data
            for (const id of Object.keys(data.game_details)) {
                if (data.game_details[id]?.source === 'buy' && !keepSet.has(id)) {
                    delete data.game_details[id]
                }
            }
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
    // Cache stores only ids + reasons; game objects resolved from game_details on load.
    async getPlaySuggestions() {
        const cached = this.#getCache('play')
        if (isFresh(cached?.generatedAt) && cached.ids?.length) {
            return cached.ids
                .map(id => ({ game: getGameDetail(id), reason: cached.reasons[id] }))
                .filter(item => item.game)
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

            const ids     = []
            const reasons = {}
            for (const { id, r: reason } of raw) {
                if (getGameDetail(id)) {
                    ids.push(id)
                    reasons[id] = reason
                }
            }

            this.#persistCache('play', ids, reasons)
            return ids.map(id => ({ game: getGameDetail(id), reason: reasons[id] }))
        } catch (err) {
            console.error('[Algorithm] getPlaySuggestions failed:', err)
            return []
        }
    }

    // Returns [{ name, reason, appid, storeData, thumbnail }] — games not yet owned.
    // Details written to game_details[appid] with source 'buy'; stale entries cleaned up on refresh.
    async getBuySuggestions() {
        const cached = this.#getCache('buy')
        if (isFresh(cached?.generatedAt) && cached.ids?.length) {
            const data = get(db)
            return cached.ids
                .map(id => {
                    const entry = data.game_details?.[id]
                    if (!entry?.data) return null
                    const d = entry.data
                    return {
                        name:      d.name,
                        reason:    cached.reasons[id],
                        appid:     id,
                        thumbnail: d.thumbnail,
                        storeData: {
                            is_free: d.is_free,
                            price:   d.price_overview ? { final_formatted: d.price_overview.final_formatted } : null,
                        },
                    }
                })
                .filter(Boolean)
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

            const ids     = []
            const reasons = {}
            const items   = []

            await Promise.all(
                suggestions.map(async ({ n: name, r: reason }) => {
                    const match = await searchStore(name)
                    if (!match) return

                    const appid     = match.id
                    const thumbnail = await resolveThumbnail(appid)
                    const slimData  = {
                        steam_appid:   appid,
                        name:          match.name ?? name,
                        thumbnail,
                        is_free:       match.is_free ?? false,
                        price_overview: match.price ? { final_formatted: match.price.final_formatted } : null,
                    }

                    db.update(data => {
                        data.game_details ??= {}
                        data.game_details[appid] = { data: slimData, fetchedAt: Date.now(), source: 'buy' }
                        return data
                    })

                    ids.push(String(appid))
                    reasons[appid] = reason
                    items.push({
                        name:      slimData.name,
                        reason,
                        appid,
                        thumbnail,
                        storeData: {
                            is_free: slimData.is_free,
                            price:   slimData.price_overview ? { final_formatted: slimData.price_overview.final_formatted } : null,
                        },
                    })
                })
            )

            this.#cleanupBuyDetails(ids)
            this.#persistCache('buy', ids, reasons)
            return items.filter(Boolean)
        } catch (err) {
            console.error('[Algorithm] getBuySuggestions failed:', err)
            return []
        }
    }

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
