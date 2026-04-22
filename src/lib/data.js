// data.js
// by Aaron Meche

import { writable } from 'svelte/store'

const app_title   = 'game-sage_prod_0.0.0'
const storage_ref = `ldb-${app_title}`

let default_filters = {
    Display:      'All',
    Genre:        'All',
    Platform:     'All',
    Max_Playtime: 'None',
    Max_Price:    'None',
    Sort:         'Relevance',
}

let initial_db = {
    user:         {},
    algr:         {},
    game_details: {},
    cache: {
        user:            { data: null, fetchedAt: null },
        library:         { ids: [], playtime: {}, blacklist: [], fetchedAt: null },
        recently_played: { items: [], fetchedAt: null },
        friends:         { data: [], fetchedAt: null },
        suggestions:     { play: null, buy: null },
    },
    filters: default_filters,
    steamID: '',
    prefs: {
        genres:      { preferred: [], excluded: [] },
        suggestions: { refreshHours: 24, aiTone: 'brief', maxResults: 9 },
        display:     { compactLibrary: false, accentColor: 'default' },
        dashboard: {
            showContinuePlaying: true,
            showRecentlyPlayed:  true,
            showSuggestions:     true,
            showNews:            true,
            showStats:           true,
            showActivity:        true,
        },
        library: { defaultSort: 'None', defaultFilter: 'All' },
        privacy: { shareActivity: true },
    },
}

const storage = {
    read:   loc => { if (typeof window === 'undefined') return null; return localStorage[loc] || null },
    write:  (loc, val) => { if (typeof window === 'undefined') return; localStorage[loc] = val },
    exists: loc => { if (typeof window === 'undefined') return false; return !!localStorage[loc] },
}

export const db = storage.exists(storage_ref)
    ? writable(JSON.parse(storage.read(storage_ref)))
    : writable(initial_db)

export const clearDB = () => {
    db.update(() => initial_db)
    console.log('Cleared db')
}

export const clearCache = () => {
    db.update(data => {
        data.game_details = {}
        data.algr         = {}
        data.cache = {
            user:            { data: null, fetchedAt: null },
            library:         { ids: [], playtime: {}, blacklist: [], fetchedAt: null },
            recently_played: { items: [], fetchedAt: null },
            friends:         { data: [], fetchedAt: null },
            suggestions:     { play: null, buy: null },
        }
        return data
    })
    console.log('Cache cleared')
}

db.subscribe(state => {
    const serialized = JSON.stringify(state)
    try {
        storage.write(storage_ref, serialized)
    } catch (e) {
        if (e?.name !== 'QuotaExceededError') return
        console.warn('[data] localStorage quota exceeded — trimming game_details cache')
        try {
            const trimmed  = { ...state }
            const details  = state.game_details ?? {}
            const kept     = Object.entries(details)
                .sort(([, a], [, b]) => (b.fetchedAt ?? 0) - (a.fetchedAt ?? 0))
                .slice(0, 150)
            trimmed.game_details = Object.fromEntries(kept)
            storage.write(storage_ref, JSON.stringify(trimmed))
        } catch {
            console.error('[data] localStorage still full after trim — session data will not persist')
        }
    }
})
