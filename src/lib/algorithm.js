// algorithm.js
// by Aaron Meche

// Algorithm Class

import { get } from 'svelte/store'
import { db } from '$lib/data'
import { buildCompactProfile, getGameDetail } from '$lib/cache'

const SUGGESTIONS_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Minimum data thresholds before AI call
const MIN_PLAYED_GAMES   = 3
const MIN_UNPLAYED_GAMES = 1

export class Algorithm {
    constructor(id = 'default') {
        this.id = id
    }

    // Private Methods

    #isCacheFresh() {
        const { generatedAt } = get(db).cache?.suggestions ?? {}
        if (!generatedAt) return false
        return (Date.now() - generatedAt) < SUGGESTIONS_TTL
    }

    #getCachedSuggestions() {
        const appids = get(db).cache?.suggestions?.appids ?? []
        return appids.map(id => getGameDetail(id)).filter(Boolean)
    }

    #persistSuggestions(appids) {
        db.update(data => {
            if (!data.cache) data.cache = {}
            data.cache.suggestions = { appids, generatedAt: Date.now() }
            return data
        })
    }

    // ─── Public ───────────────────────────────────────────────────────────────

    /**
     * Return an array of Steam game-detail objects recommended for this user.
     *
     * On the first call (or after invalidate()), it:
     *   1. Builds a compact profile from the local cache
     *   2. POSTs it to /api/sage (which calls Claude server-side)
     *   3. Maps the returned appids to cached game detail objects
     *   4. Persists the result for 24 hours
     *
     * On subsequent calls within the TTL window, returns from cache instantly.
     */
    async getSuggestions() {
        if (this.#isCacheFresh()) {
            return this.#getCachedSuggestions()
        }

        const { text, playedCount, unplayedCount } = buildCompactProfile()

        if (playedCount < MIN_PLAYED_GAMES || unplayedCount < MIN_UNPLAYED_GAMES) {
            console.warn(
                `[Algorithm] Insufficient cache data for suggestions ` +
                `(played=${playedCount}, unplayed=${unplayedCount}). ` +
                `Run startCacheUpdateCycle() and wait for more details to load.`
            )
            return []
        }

        try {
            const res = await fetch('/api/sage', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ profile: text }),
            })

            if (!res.ok) {
                const msg = await res.text().catch(() => res.statusText)
                throw new Error(`/api/sage responded ${res.status}: ${msg}`)
            }

            const { s: appids } = await res.json()

            if (!Array.isArray(appids)) {
                throw new Error('Claude returned unexpected shape — expected { s: number[] }')
            }

            this.#persistSuggestions(appids)
            return appids.map(id => getGameDetail(id)).filter(Boolean)

        } catch (err) {
            console.error('[Algorithm] getSuggestions failed:', err)
            return []
        }
    }

    /**
     * Force the next getSuggestions() call to re-query Claude
     * (e.g. after rating games or when the library grows significantly).
     */
    invalidate() {
        db.update(data => {
            if (data.cache?.suggestions) {
                data.cache.suggestions.generatedAt = 0
            }
            return data
        })
        console.log('[Algorithm] Suggestion cache invalidated.')
    }

    /**
     * Debug helper — logs the profile that would be sent to Claude.
     */
    printProfile() {
        const { text, playedCount, unplayedCount } = buildCompactProfile()
        console.log(
            `[Algorithm] Profile (played=${playedCount}, unplayed=${unplayedCount}):\n${text}`
        )
    }
}
