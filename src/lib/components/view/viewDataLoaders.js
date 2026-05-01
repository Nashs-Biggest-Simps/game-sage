import { fetchGameDetail } from '$lib/cache'
import { steamAPI } from '$lib/steam'
import {
	VIEW_TTL,
	needsRichGameDetail,
	readViewCache,
	writeViewCache,
} from '$lib/components/view/viewPageUtils'

export function cachedViewGame(state, id) {
	return state?.cache?.library?.details?.[id]?.data ?? null
}

export function ownsViewGame(state, id) {
	return Object.prototype.hasOwnProperty.call(state?.cache?.library?.playtime ?? {}, id)
}

export async function loadRichGameDetail(id, cachedGame) {
	if (cachedGame && !needsRichGameDetail(cachedGame)) return undefined
	return fetchGameDetail(id).catch(() => null)
}

export function loadViewHltb(id) {
	const cached = readViewCache(id, 'hltb', VIEW_TTL.hltb)
	if (cached !== null) return Promise.resolve(cached)

	return new Promise(resolve => {
		steamAPI.howLongToBeat(id, (ret) => {
			const data = ret ?? null
			writeViewCache(id, 'hltb', data)
			resolve(data)
		})
	})
}

export function loadViewNews(id) {
	const cached = readViewCache(id, 'news', VIEW_TTL.news)
	if (cached !== null) return Promise.resolve(cached)

	return new Promise(resolve => {
		steamAPI.getNewsForApp(id, (ret) => {
			const data = ret?.appnews?.newsitems?.slice(0, 4) ?? []
			writeViewCache(id, 'news', data)
			resolve(data)
		})
	})
}

export function loadViewAchievements(id) {
	const cached = readViewCache(id, 'achievements', VIEW_TTL.achievements)
	if (cached !== null) return Promise.resolve(cached)

	return new Promise(resolve => {
		steamAPI.getPlayerAchievements(id, (ret) => {
			const data = ret?.playerstats ?? null
			writeViewCache(id, 'achievements', data)
			resolve(data)
		})
	})
}

export function loadViewGlobalAchievementPercentages(id) {
	const cached = readViewCache(id, 'globalPcts', VIEW_TTL.globalPcts)
	if (cached !== null) return Promise.resolve(cached)

	return new Promise(resolve => {
		steamAPI.getGlobalAchievementPercentages(id, (ret) => {
			const data = ret ?? null
			writeViewCache(id, 'globalPcts', data)
			resolve(data)
		})
	})
}
