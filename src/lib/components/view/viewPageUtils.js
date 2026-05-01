import { get } from 'svelte/store'
import { db } from '$lib/data'
import { resolveThumbnail } from '$lib/cache'

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

export function releaseLabel(game) {
    const date = game?.release_date?.date?.trim?.() ?? ''
    if (!date) return null
    return game?.release_date?.coming_soon ? `Coming ${date}` : date
}

export function controllerSupportLabel(game) {
    const support = String(game?.controller_support ?? '').trim().toLowerCase()
    if (!support) return null
    if (support === 'full') return 'Full controller support'
    if (support === 'partial') return 'Partial controller support'
    return titleCase(support)
}

export function ageRating(game) {
    const age = Number(game?.required_age ?? 0)
    return Number.isFinite(age) && age > 0 ? `${age}+` : null
}

export function platformNames(game) {
    return Object.entries(game?.platforms ?? {})
        .filter(([, supported]) => supported)
        .map(([platform]) => titleCase(platform))
}

export function heroMetaItems(game) {
    const items = []
    const release = releaseLabel(game)

    if (game?.developers?.[0]) items.push(game.developers[0])
    if (game?.publishers?.[0] && game.publishers[0] !== game?.developers?.[0]) {
        items.push(game.publishers[0])
    }
    if (release) items.push(release)

    return items
}

export function gameDetailRows({
    game,
    platforms = [],
    totalAchievements = 0,
    reviewTotal = null,
    screenshotCount = 0,
    movieCount = 0,
}) {
    const rows = []
    const release = releaseLabel(game)

    if (game?.type) rows.push({ label: 'Type', value: titleCase(game.type) })
    if (release) {
        rows.push({
            label: game?.release_date?.coming_soon ? 'Launch' : 'Released',
            value: release,
        })
    }
    if (game?.developers?.length) rows.push({ label: 'Developer', value: game.developers.join(', ') })
    if (game?.publishers?.length) rows.push({ label: 'Publisher', value: game.publishers.join(', ') })
    if (platforms.length) rows.push({ label: 'Platforms', value: platforms.join(', ') })
    if (totalAchievements > 0) rows.push({ label: 'Achievements', value: `${totalAchievements} total` })
    if (reviewTotal) rows.push({ label: 'Reviews', value: `${reviewTotal.toLocaleString()} reviews` })
    if (game?.dlc_count > 0) rows.push({ label: 'DLC', value: `${game.dlc_count} items` })
    if (screenshotCount > 0) rows.push({ label: 'Screenshots', value: `${screenshotCount} available` })
    if (movieCount > 0) rows.push({ label: 'Trailers', value: `${movieCount} available` })

    return rows
}

export function supportRows(game, supportedLanguages = []) {
    const rows = []
    const controller = controllerSupportLabel(game)
    const rating = ageRating(game)

    if (controller) rows.push({ label: 'Controller', value: controller })
    if (rating) rows.push({ label: 'Age Gate', value: rating })
    if (supportedLanguages.length) {
        rows.push({
            label: 'Languages',
            value: supportedLanguages.slice(0, 2).join(', ') +
                (supportedLanguages.length > 2 ? ` +${supportedLanguages.length - 2}` : ''),
        })
    }

    return rows
}

export function heroImageCandidates({ appid, game, cachedGame }) {
    return [...new Set([
        ...fallbackHeroImages(appid ?? '0'),
        game?.hero_image,
        cachedGame?.hero_image,
        game?.thumbnail,
        cachedGame?.thumbnail,
        appid ? resolveThumbnail(appid) : null,
    ].filter(Boolean))]
}

export function primaryHltbLabel(hltb) {
    return hltbFmt(hltb?.mainStory ?? hltb?.mainStoryWithExtras ?? hltb?.completionist)
}
