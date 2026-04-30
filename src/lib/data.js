// data.js
// Local browser store for GameSage.
//
// Keep this file boring and readable:
// - `db` is the single app state store.
// - The store is persisted to localStorage.
// - Persistence is delayed so large Steam cache updates do not block the UI.

import { writable } from 'svelte/store'

const APP_TITLE = 'gamesage_0.4'
const STORAGE_KEY = `ldb-${APP_TITLE}`

// localStorage writes are synchronous, so do not write after every db.update.
const SAVE_DELAY_MS = 700

// Game details are the largest part of the store. Keeping a recent subset
// makes reloads fast and prevents older sessions from ballooning memory usage.
const MAX_PERSISTED_GAME_DETAILS = 160
const EMERGENCY_GAME_DETAIL_LIMIT = 80

const DEFAULT_FILTERS = {
    Display: 'All',
    Genre: 'All',
    Platform: 'All',
    Sort: 'None',
}

const DEFAULT_DB = {
    user: {},
    cache: {},
    filters: DEFAULT_FILTERS,
    steamID: '',
    prefs: {
        genres: { preferred: [], excluded: [] },
        suggestions: { refreshHours: 24, aiTone: 'brief', maxResults: 10 },
        display: { compactLibrary: false },
        library: { defaultSort: 'None', defaultFilter: 'All' },
    },
}

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function createDefaultDB() {
    return clone(DEFAULT_DB)
}

function readLocalStorage(key) {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
}

function writeLocalStorage(key, value) {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
}

function clearLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
}

function keepKnownFilters(filters = {}) {
    const next = { ...DEFAULT_FILTERS }
    for (const key of Object.keys(DEFAULT_FILTERS)) {
        if (filters[key] !== undefined) next[key] = filters[key]
    }
    return next
}

function applyDefaults(savedValue) {
    const saved = savedValue && typeof savedValue === 'object' ? savedValue : {}
    const defaults = createDefaultDB()

    return {
        ...defaults,
        ...saved,
        filters: keepKnownFilters(saved.filters),
        prefs: {
            ...defaults.prefs,
            genres: {
                ...defaults.prefs.genres,
                ...(saved.prefs?.genres ?? {}),
            },
            suggestions: {
                ...defaults.prefs.suggestions,
                ...(saved.prefs?.suggestions ?? {}),
            },
            display: {
                ...defaults.prefs.display,
                compactLibrary: saved.prefs?.display?.compactLibrary ?? defaults.prefs.display.compactLibrary,
            },
            library: {
                ...defaults.prefs.library,
                ...(saved.prefs?.library ?? {}),
            },
        },
    }
}

function keepRecentGameDetails(details = {}, limit = MAX_PERSISTED_GAME_DETAILS) {
    const entries = Object.entries(details)
    if (entries.length <= limit) return details

    return Object.fromEntries(
        entries
            .sort(([, a], [, b]) => (b.fetchedAt ?? 0) - (a.fetchedAt ?? 0))
            .slice(0, limit)
    )
}

function shrinkForStorage(state, detailLimit = MAX_PERSISTED_GAME_DETAILS) {
    const details = state.cache?.library?.details
    if (!details) return state

    const trimmedDetails = keepRecentGameDetails(details, detailLimit)
    if (trimmedDetails === details) return state

    return {
        ...state,
        cache: {
            ...state.cache,
            library: {
                ...state.cache.library,
                details: trimmedDetails,
            },
        },
    }
}

function loadInitialDB() {
    const raw = readLocalStorage(STORAGE_KEY)
    if (!raw) return createDefaultDB()

    try {
        const saved = JSON.parse(raw)
        return shrinkForStorage(applyDefaults(saved))
    } catch {
        console.warn('[data] Stored DB was invalid; starting fresh')
        return createDefaultDB()
    }
}

export const db = writable(loadInitialDB())

let saveTimer = null
let pendingState = null
let lastSavedJSON = null
let hasSeenInitialState = false

function writeDBNow(state, detailLimit = MAX_PERSISTED_GAME_DETAILS) {
    const stateToSave = shrinkForStorage(state, detailLimit)
    const json = JSON.stringify(stateToSave)

    if (json === lastSavedJSON) return

    writeLocalStorage(STORAGE_KEY, json)
    lastSavedJSON = json
}

function saveWithQuotaFallback(state) {
    try {
        writeDBNow(state)
    } catch (error) {
        if (error?.name !== 'QuotaExceededError') return

        console.warn('[data] localStorage quota exceeded; saving a smaller game detail cache')
        try {
            writeDBNow(state, EMERGENCY_GAME_DETAIL_LIMIT)
        } catch {
            console.error('[data] localStorage is still full; session data will not persist')
        }
    }
}

function runWhenBrowserIsIdle(callback) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1500 })
    } else {
        callback()
    }
}

function scheduleSave(state) {
    pendingState = state
    if (saveTimer) clearTimeout(saveTimer)

    saveTimer = setTimeout(() => {
        saveTimer = null
        runWhenBrowserIsIdle(() => {
            if (!pendingState) return
            saveWithQuotaFallback(pendingState)
            pendingState = null
        })
    }, SAVE_DELAY_MS)
}

function flushSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null

    if (!pendingState) return
    saveWithQuotaFallback(pendingState)
    pendingState = null
}

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushSave()
    })
}

export function clearCache() {
    db.update(data => {
        const sameSteamID = data.cache?.user?.data?.steamid === data.steamID
        const confirmedSteamProfile = sameSteamID
            ? {
                user: data.cache.user,
                status: {
                    ...(data.cache?.status?.steam ? { steam: data.cache.status.steam } : {}),
                },
            }
            : {}

        data.cache = confirmedSteamProfile
        data.algr = {}
        return data
    })
}

export function hardResetDB() {
    clearLocalStorage()
    lastSavedJSON = null
    pendingState = null
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = null

    db.set(createDefaultDB())
}

db.subscribe(state => {
    if (!hasSeenInitialState) {
        hasSeenInitialState = true
        lastSavedJSON = JSON.stringify(shrinkForStorage(state))
        return
    }

    scheduleSave(state)
})
