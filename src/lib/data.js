// data.js
// by Aaron Meche

// This file exports a "db" constant
// that allows for easy and convenient
// local data storage on client browsers


import { writable, readable } from 'svelte/store'

const app_title = "gamesage_0.4"
const storage_ref = `ldb-${app_title}`

let default_filters = {
    "Display": "All",
    "Genre": "All",
    "Platform": "All",
    "Max_Playtime": "None",
    "Max_Price": "None",
    "Sort": "Relevance"
}

let initial_db = {
    user: {},
    cache: {},
    filters: default_filters,
    steamID: '',
    prefs: {
        genres: { preferred: [], excluded: [] },
        suggestions: { refreshHours: 24, aiTone: 'brief', maxResults: 9 },
        display: { compactLibrary: false, accentColor: 'default' },
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
    read: function (location) {
        if (typeof window =="undefined") return
        return localStorage[location] || null
    },
    write: function (location, value) {
        if (typeof window =="undefined") return
        localStorage[location] = value
    },
    clear: function() {
        if (typeof window =="undefined") return
        localStorage.clear()
    },
    exists: function (location) {
		if (typeof window =="undefined") return
        if (localStorage[location])      return true
		else                             return false
	}
}

export const db = storage.exists(storage_ref) ? writable(JSON.parse(storage.read(storage_ref))) : writable(initial_db)

export const clearDB = () => {
    db.update(data => {
        data = initial_db
        return data
    })
    console.log("Cleared db")
}

export const clearCache = () => {
    db.update(data => {
        data.cache = {}
        data.algr  = {}
        return data
    })
    console.log("Cache cleared")
}

db.subscribe(state => {
    const serialized = JSON.stringify(state)
    try {
        storage.write(storage_ref, serialized)
    } catch (e) {
        if (e?.name !== 'QuotaExceededError') return
        // Detail cache is the main culprit when quota is exceeded.
        // Keep the 100 most-recently-fetched entries and retry once.
        console.warn('[data] localStorage quota exceeded — trimming detail cache')
        try {
            const trimmed = { ...state, cache: { ...state.cache, library: { ...state.cache?.library } } }
            const details  = state.cache?.library?.details ?? {}
            const kept     = Object.entries(details)
                .sort(([, a], [, b]) => (b.fetchedAt ?? 0) - (a.fetchedAt ?? 0))
                .slice(0, 100)
            trimmed.cache.library.details = Object.fromEntries(kept)
            storage.write(storage_ref, JSON.stringify(trimmed))
        } catch {
            console.error('[data] localStorage still full after trim — session data will not persist')
        }
    }
})