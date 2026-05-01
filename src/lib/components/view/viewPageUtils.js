import { get } from 'svelte/store'
import { db } from '$lib/data'

export const VIEW_TTL = {
    hltb: 7 * 24 * 60 * 60 * 1000,
    news: 6 * 60 * 60 * 1000,
    achievements: 15 * 60 * 1000,
    globalPcts: 7 * 24 * 60 * 60 * 1000,
}

export function readViewCache(id, key, ttl) {
    const entry = get(db)?.cache?.view?.[id]?.[key] ?? null
    return entry?.fetchedAt && Date.now() - entry.fetchedAt < ttl ? entry.data : null
}

export function writeViewCache(id, key, data) {
    db.update((state) => {
        state.cache ??= {}
        state.cache.view ??= {}
        state.cache.view[id] ??= {}
        state.cache.view[id][key] = { data, fetchedAt: Date.now() }
        return state
    })
}

export function needsRichGameDetail(game) {
    return !Array.isArray(game?.screenshots) ||
        !Array.isArray(game?.movies) ||
        game?.platforms == null ||
        game?.supported_languages === undefined ||
        game?.website === undefined ||
        game?.required_age === undefined ||
        game?.controller_support === undefined ||
        game?.dlc_count === undefined ||
        game?.hero_image === undefined
}

export function fallbackHeroImages(id) {
    return [
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/library_hero.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
    ]
}

export function hltbFmt(val) {
    if (!val) return null
    const h = Math.trunc(val)
    const m = Math.round((val % 1) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function newsDate(unix) {
    return new Date(unix * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export function stripHtml(html) {
    return (html ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220)
}

export function titleCase(value = '') {
    return String(value)
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ')
}

export function normalizeWebsiteUrl(value) {
    const url = String(value ?? '').trim()
    if (!url) return null
    return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
