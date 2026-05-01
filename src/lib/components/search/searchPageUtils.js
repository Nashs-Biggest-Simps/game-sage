import { resolveThumbnail } from '$lib/cache'

export const SEARCH_GENRE_OPTIONS = [
	'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
	'Sports', 'Racing', 'Puzzle', 'Horror', 'Indie',
	'Casual', 'Shooter', 'Multiplayer', 'Open World', 'Survival',
]

export function buildOwnedSearchResults({
	query,
	appIds,
	details,
	playtime,
	genreFilter,
}) {
	const normalizedQuery = query.trim().toLowerCase()
	if (!normalizedQuery) return []

	return appIds
		.map(id => ({
			appid: id,
			detail: details[id]?.data ?? null,
			playtime: playtime[id] ?? 0,
		}))
		.filter(game => {
			if (!game.detail?.name) return false
			if (!game.detail.name.toLowerCase().includes(normalizedQuery)) return false
			if (genreFilter && !game.detail.genres?.some(genre => genre.description === genreFilter)) return false
			return true
		})
		.slice(0, 60)
}

export function formatPrice(item) {
	if (!item.price || item.price.final === 0) return 'Free'
	return `$${(item.price.final / 100).toFixed(2)}`
}

export function discount(item) {
	return item.price?.discount_percent > 0 ? item.price.discount_percent : null
}

export function hoursLabel(minutes) {
	const hours = Math.round(minutes / 60)
	if (hours === 0) return 'Unplayed'
	if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k h`
	return `${hours.toLocaleString()}h`
}

export function ownedThumbnail(detail, appid) {
	return detail?.thumbnail ?? detail?.header_image ?? resolveThumbnail(appid)
}

export function storeThumbnail(item) {
	return item.large_capsule_image
		?? item.header_image
		?? item.tiny_image
		?? resolveThumbnail(item.id)
}

export function storeFallbackThumbnail(item) {
	return item.tiny_image ?? resolveThumbnail(item.id)
}
