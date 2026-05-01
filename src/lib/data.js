// Single local app-state store for GameSage.

import { writable } from 'svelte/store'
import {
	DEFAULT_ACTIVITY_LAYOUT,
	DEFAULT_DASHBOARD_CONTENT_LAYOUT,
	DEFAULT_DASHBOARD_LAYOUT,
	DEFAULT_DASHBOARD_RIGHT_ORDER,
} from '$lib/dashboardLayout'

const STORAGE_KEY = 'ldb-gamesage_0.4'
const SAVE_DELAY_MS = 700
const DETAIL_LIMIT = 160
const EMERGENCY_DETAIL_LIMIT = 80
const VIEW_LIMIT = 40
const FRIEND_BUCKET_LIMIT = 14 * 24

export const DEFAULT_FILTERS = {
	Display: 'All',
	Genre: 'All',
	Platform: 'All',
	Sort: 'None',
}

export const DEFAULT_DB = {
	user: {},
	cache: {},
	filters: DEFAULT_FILTERS,
	steamID: '',
	prefs: {
		genres: { preferred: [], excluded: [] },
		suggestions: {
			refreshHours: 24,
			aiTone: 'brief',
			maxResults: 10,
			hideMatureContent: false,
		},
		display: {
			compactLibrary: false,
			fullWidthMode: false,
			boringBackground: false,
		},
		library: {
			defaultSort: 'None',
			defaultFilter: 'All',
		},
		dashboard: {
			layout: DEFAULT_DASHBOARD_LAYOUT,
			contentLayout: DEFAULT_DASHBOARD_CONTENT_LAYOUT,
			rightOrder: DEFAULT_DASHBOARD_RIGHT_ORDER,
		},
		activity: {
			layout: DEFAULT_ACTIVITY_LAYOUT,
		},
	},
}

let saveTimer = null
let pendingState = null
let lastSavedJSON = null
let initialized = false

export function createDefaultDB() {
	return clone(DEFAULT_DB)
}

export const db = writable(loadDB())

if (typeof window !== 'undefined') {
	window.addEventListener('pagehide', flushSave)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') flushSave()
	})
}

db.subscribe(state => {
	if (!initialized) {
		initialized = true
		lastSavedJSON = JSON.stringify(trimForStorage(state))
		return
	}

	scheduleSave(state)
})

export function clearCache() {
	db.update(data => {
		const steamStatus = data.cache?.status?.steam
		const keepSteamProfile = data.cache?.user?.data?.steamid === data.steamID

		return {
			...data,
			cache: keepSteamProfile
				? {
					user: data.cache.user,
					status: steamStatus ? { steam: steamStatus } : {},
				}
				: {},
			algr: {},
		}
	})
}

export function hardResetDB() {
	if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
	if (saveTimer) clearTimeout(saveTimer)

	saveTimer = null
	pendingState = null
	lastSavedJSON = null
	db.set(createDefaultDB())
}

function loadDB() {
	if (typeof window === 'undefined') return createDefaultDB()

	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? trimForStorage(withDefaults(JSON.parse(raw))) : createDefaultDB()
	} catch {
		console.warn('[data] Stored DB was invalid; starting fresh')
		return createDefaultDB()
	}
}

function withDefaults(savedValue) {
	const saved = isPlainObject(savedValue) ? savedValue : {}
	return deepMerge(createDefaultDB(), saved)
}

function scheduleSave(state) {
	pendingState = state
	if (saveTimer) clearTimeout(saveTimer)

	saveTimer = setTimeout(() => {
		saveTimer = null
		runWhenIdle(flushSave)
	}, SAVE_DELAY_MS)
}

function flushSave() {
	if (saveTimer) clearTimeout(saveTimer)
	saveTimer = null

	if (!pendingState || typeof window === 'undefined') return
	saveWithFallback(pendingState)
	pendingState = null
}

function saveWithFallback(state) {
	try {
		writeState(state)
	} catch (error) {
		if (error?.name !== 'QuotaExceededError') return

		console.warn('[data] localStorage quota exceeded; saving a smaller cache')
		try {
			writeState(state, EMERGENCY_DETAIL_LIMIT)
		} catch {
			console.error('[data] localStorage is still full; session data will not persist')
		}
	}
}

function writeState(state, detailLimit = DETAIL_LIMIT) {
	const json = JSON.stringify(trimForStorage(state, detailLimit))
	if (json === lastSavedJSON) return

	localStorage.setItem(STORAGE_KEY, json)
	lastSavedJSON = json
}

function trimForStorage(state, detailLimit = DETAIL_LIMIT) {
	const cache = state.cache
	if (!cache) return state

	return {
		...state,
		cache: {
			...cache,
			...(cache.view ? { view: keepRecent(cache.view, VIEW_LIMIT, byNestedFetch) } : {}),
			...(cache.friendPopularity ? { friendPopularity: keepRecent(cache.friendPopularity, FRIEND_BUCKET_LIMIT, byKeyDesc) } : {}),
			...(cache.library?.details ? {
				library: {
					...cache.library,
					details: keepRecent(cache.library.details, detailLimit, byFetchedAt),
				},
			} : {}),
		},
	}
}

function keepRecent(value = {}, limit, compare) {
	const entries = Object.entries(value)
	if (entries.length <= limit) return value

	return Object.fromEntries(entries.sort(compare).slice(0, limit))
}

function byFetchedAt([, a], [, b]) {
	return (b.fetchedAt ?? 0) - (a.fetchedAt ?? 0)
}

function byNestedFetch([, a], [, b]) {
	return newestNestedFetch(b) - newestNestedFetch(a)
}

function byKeyDesc([a], [b]) {
	return b.localeCompare(a)
}

function newestNestedFetch(value = {}) {
	return Math.max(0, ...Object.values(value).map(entry => entry?.fetchedAt ?? 0).filter(Number.isFinite))
}

function runWhenIdle(callback) {
	if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
		requestIdleCallback(callback, { timeout: 1500 })
	} else {
		callback()
	}
}

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function deepMerge(base, saved) {
	const next = { ...base }

	for (const [key, value] of Object.entries(saved)) {
		next[key] = isPlainObject(value) && isPlainObject(base[key])
			? deepMerge(base[key], value)
			: value
	}

	return next
}

function isPlainObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value)
}
