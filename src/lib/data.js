import { writable } from 'svelte/store'

const APP_TITLE = 'gamesage_0.1.0'
const STORAGE_REF = `ldb-${APP_TITLE}`

const DEFAULT_FILTERS = {
    Display: 'All',
    Sort: 'None',
}

const INITIAL_DB = {
    schemaVersion: 2,
    session: {
        active: false,
        mode: null,
        startedAt: null,
    },
    user: null,
    algr: {},
    cache: {},
    filters: { ...DEFAULT_FILTERS },
    steamID: '',
    prefs: {
        genres: { preferred: [], excluded: [] },
        suggestions: { refreshHours: 24, aiTone: 'brief', maxResults: 8 },
        display: { compactLibrary: false, accentColor: 'default' },
        dashboard: {
            showContinuePlaying: true,
            showRecentlyPlayed: true,
            showSuggestions: true,
            showNews: true,
            showStats: true,
            showActivity: true,
        },
        library: { defaultSort: 'None', defaultFilter: 'All' },
        privacy: { shareActivity: true },
    },
}

function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function mergeDefaults(base, incoming) {
    if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : [...base]
    if (!isObject(base)) return incoming === undefined ? base : incoming

    const source = isObject(incoming) ? incoming : {}
    const result = {}
    const keys = new Set([...Object.keys(base), ...Object.keys(source)])

    for (const key of keys) {
        if (!(key in base)) {
            result[key] = source[key]
            continue
        }
        result[key] = mergeDefaults(base[key], source[key])
    }

    return result
}

function readStorage() {
    if (typeof window === 'undefined') return clone(INITIAL_DB)

    try {
        const raw = localStorage.getItem(STORAGE_REF)
        if (!raw) return clone(INITIAL_DB)
        const parsed = JSON.parse(raw)
        return mergeDefaults(INITIAL_DB, parsed)
    } catch (error) {
        console.warn('[data] Could not read local state, resetting store.', error)
        return clone(INITIAL_DB)
    }
}

function writeStorage(state) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_REF, JSON.stringify(state))
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function splitPath(path) {
    return path.split('.').filter(Boolean)
}

/**
 * @param {object} state
 * @param {string[]} keys
 * @param {unknown} value
 */
function writeAtPath(state, keys, value) {
    let target = state
    for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index]
        target[key] ??= {}
        target = target[key]
    }
    target[keys[keys.length - 1]] = value
}

function updateState(updater) {
    db.update((state) => {
        updater(state)
        return state
    })
}

export const db = writable(readStorage())

export function hasAppSession(state) {
    return !!(state?.session?.active || state?.user?.uid)
}

export function startGuestSession() {
    updateState((state) => {
        state.session = {
            active: true,
            mode: 'guest',
            startedAt: Date.now(),
        }
    })
}

export function endSession() {
    updateState((state) => {
        state.session = {
            active: false,
            mode: null,
            startedAt: null,
        }
        state.user = null
    })
}

export function syncAuthedUser(user) {
    updateState((state) => {
        state.user = user

        if (user?.uid) {
            state.session = {
                active: true,
                mode: 'google',
                startedAt: state.session?.startedAt ?? Date.now(),
            }
            return
        }

        if (state.session?.mode === 'guest' && state.session?.active) return

        state.session = {
            active: false,
            mode: null,
            startedAt: null,
        }
    })
}

export function clearDB() {
    db.set(clone(INITIAL_DB))
}

export function clearCache() {
    updateState((state) => {
        state.cache = {}
        state.algr = {}
    })
}

export function clearSuggestionCache(type = 'all') {
    updateState((state) => {
        const suggestions = state.cache?.suggestions
        if (!suggestions) return
        if (type === 'all') {
            delete state.cache.suggestions
            return
        }
        delete suggestions[type]
    })
}

export function setSteamID(value) {
    const trimmed = value.trim()
    updateState((state) => {
        const changed = state.steamID !== trimmed
        state.steamID = trimmed
        if (changed) {
            state.cache = {}
            state.algr = {}
        }
    })
}

export function setFilter(key, value) {
    updateState((state) => {
        state.filters ??= { ...DEFAULT_FILTERS }
        state.filters[key] = value
    })
}

export function applyLibraryDefaults() {
    updateState((state) => {
        state.filters ??= { ...DEFAULT_FILTERS }
        state.filters.Display = state.prefs?.library?.defaultFilter ?? 'All'
        state.filters.Sort = state.prefs?.library?.defaultSort ?? 'None'
    })
}

export function setPreference(path, value) {
    updateState((state) => {
        state.prefs ??= clone(INITIAL_DB.prefs)
        writeAtPath(state.prefs, splitPath(path), value)
        if (state.cache?.suggestions) delete state.cache.suggestions
    })
}

export function cycleGenrePreference(genre) {
    updateState((state) => {
        state.prefs ??= clone(INITIAL_DB.prefs)
        const preferred = state.prefs.genres?.preferred ?? []
        const excluded = state.prefs.genres?.excluded ?? []

        const isPreferred = preferred.includes(genre)
        const isExcluded = excluded.includes(genre)

        if (!isPreferred && !isExcluded) {
            state.prefs.genres.preferred = [...preferred, genre]
        } else if (isPreferred) {
            state.prefs.genres.preferred = preferred.filter((item) => item !== genre)
            state.prefs.genres.excluded = [...excluded, genre]
        } else {
            state.prefs.genres.excluded = excluded.filter((item) => item !== genre)
        }

        if (state.cache?.suggestions) delete state.cache.suggestions
    })
}

db.subscribe((state) => {
    try {
        writeStorage(state)
    } catch (error) {
        if (error?.name !== 'QuotaExceededError') return

        console.warn('[data] localStorage quota exceeded, trimming detail cache.')

        try {
            const trimmed = mergeDefaults(INITIAL_DB, state)
            const details = state.cache?.library?.details ?? {}
            const kept = Object.entries(details)
                .sort(([, left], [, right]) => (right?.fetchedAt ?? 0) - (left?.fetchedAt ?? 0))
                .slice(0, 100)

            trimmed.cache.library ??= {}
            trimmed.cache.library.details = Object.fromEntries(kept)
            writeStorage(trimmed)
        } catch (trimError) {
            console.error('[data] localStorage still full after trim.', trimError)
        }
    }
})
