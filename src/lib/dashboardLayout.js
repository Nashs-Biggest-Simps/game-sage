export const DASHBOARD_MODULES = [
	{
		id: 'recommendedActions',
		label: 'Recommended Actions',
	},
	{
		id: 'librarySnapshot',
		label: 'Library Snapshot',
	},
	{
		id: 'liveFriendPulse',
		label: 'Live Friend Pulse',
	},
	{
		id: 'unplayedGenre',
		label: 'Unplayed Popular Genre',
	},
	{
		id: 'recentSessions',
		label: 'Recent Sessions',
	},
	{
		id: 'friendActivityPulse',
		label: 'Friend Activity Pulse',
	},
]

export const DEFAULT_DASHBOARD_LAYOUT = DASHBOARD_MODULES.map(module => ({
	id: module.id,
	enabled: true,
}))

export const DASHBOARD_CONTENT_MODULES = [
	{
		id: 'recentlyPlayed',
		label: 'Recently Played',
		defaultColumn: 'left',
	},
	{
		id: 'aiStorePicks',
		label: 'AI Store Picks',
		defaultColumn: 'left',
	},
	{
		id: 'libraryBacklog',
		label: 'Library Backlog Picks',
		defaultColumn: 'left',
	},
	{
		id: 'changeOfPace',
		label: 'Change of Pace',
		defaultColumn: 'left',
	},
	{
		id: 'thisWeek',
		label: 'Most Played This Week',
		defaultColumn: 'left',
	},
	{
		id: 'mostPlayed',
		label: 'Most Played All-Time',
		defaultColumn: 'left',
	},
	{
		id: 'friendCircle',
		label: 'Friend Circle Momentum',
		defaultColumn: 'left',
	},
	{
		id: 'friendsUnowned',
		label: "Friends' Unowned Picks",
		defaultColumn: 'left',
	},
	{
		id: 'steamCharts',
		label: 'Steam Chart Picks',
		defaultColumn: 'left',
	},
	{
		id: 'gameNews',
		label: 'Game News',
		defaultColumn: 'right',
	},
]

export const DEFAULT_DASHBOARD_CONTENT_LAYOUT = {
	left: DASHBOARD_CONTENT_MODULES
		.filter(module => module.defaultColumn === 'left')
		.map(module => ({ id: module.id, enabled: true })),
	right: DASHBOARD_CONTENT_MODULES
		.filter(module => module.defaultColumn === 'right')
		.map(module => ({ id: module.id, enabled: true })),
}

export const DEFAULT_DASHBOARD_RIGHT_ORDER = [
	...DEFAULT_DASHBOARD_CONTENT_LAYOUT.right.map(item => dashboardContentKey(item.id)),
	...DEFAULT_DASHBOARD_LAYOUT.map(item => dashboardPanelKey(item.id)),
]

export const ACTIVITY_MODULES = [
	{
		id: 'recentSessions',
		label: 'Recent Sessions',
		defaultColumn: 'left',
	},
	{
		id: 'topGamesPlayed',
		label: 'Top Games Played',
		defaultColumn: 'left',
	},
	{
		id: 'joinFriends',
		label: 'Play With Friends',
		defaultColumn: 'left',
	},
	{
		id: 'genreBreakdown',
		label: 'Genre Breakdown',
		defaultColumn: 'left',
	},
	{
		id: 'friendsInGame',
		label: 'Friends In-Game',
		defaultColumn: 'left',
	},
	{
		id: 'liveFriendPulse',
		label: 'Live Friend Pulse',
		defaultColumn: 'right',
	},
	{
		id: 'lastSeen',
		label: 'Last Seen',
		defaultColumn: 'right',
	},
	{
		id: 'libraryProfile',
		label: 'Library Profile',
		defaultColumn: 'right',
	},
	{
		id: 'friendsList',
		label: 'Friends List',
		defaultColumn: 'right',
	},
	{
		id: 'advancedFriendInsights',
		label: 'Advanced Friend Insights',
		defaultColumn: 'right',
	},
]

export const DEFAULT_ACTIVITY_LAYOUT = {
	left: ACTIVITY_MODULES
		.filter(module => module.defaultColumn === 'left')
		.map(module => ({ id: module.id, enabled: true })),
	right: ACTIVITY_MODULES
		.filter(module => module.defaultColumn === 'right')
		.map(module => ({ id: module.id, enabled: true })),
}

export function normalizeDashboardLayout(savedLayout = []) {
	const savedById = new Map(
		Array.isArray(savedLayout)
			? savedLayout.map(item => [item?.id, item])
			: []
	)
	const knownIds = new Set(DASHBOARD_MODULES.map(module => module.id))
	const ordered = []

	for (const item of Array.isArray(savedLayout) ? savedLayout : []) {
		if (!knownIds.has(item?.id)) continue
		if (ordered.some(existing => existing.id === item.id)) continue

		ordered.push({
			id: item.id,
			enabled: item.enabled !== false,
		})
	}

	for (const module of DASHBOARD_MODULES) {
		if (ordered.some(item => item.id === module.id)) continue

		ordered.push({
			id: module.id,
			enabled: savedById.get(module.id)?.enabled !== false,
		})
	}

	return ordered
}

export function dashboardModuleLabel(id) {
	return DASHBOARD_MODULES.find(module => module.id === id)?.label ?? id
}

function normalizeColumnLayout(savedLayout = {}, modules = []) {
	const knownIds = new Set(modules.map(module => module.id))
	const columns = { left: [], right: [] }
	const seen = new Set()

	for (const columnKey of ['left', 'right']) {
		const savedColumn = Array.isArray(savedLayout?.[columnKey]) ? savedLayout[columnKey] : []

		for (const item of savedColumn) {
			if (!knownIds.has(item?.id) || seen.has(item.id)) continue

			columns[columnKey].push({
				id: item.id,
				enabled: item.enabled !== false,
			})
			seen.add(item.id)
		}
	}

	for (const module of modules) {
		if (seen.has(module.id)) continue

		columns[module.defaultColumn ?? 'left'].push({
			id: module.id,
			enabled: true,
		})
	}

	return columns
}

export function normalizeDashboardContentLayout(savedLayout = {}) {
	return normalizeColumnLayout(savedLayout, DASHBOARD_CONTENT_MODULES)
}

export function dashboardContentModuleLabel(id) {
	return DASHBOARD_CONTENT_MODULES.find(module => module.id === id)?.label ?? id
}

export function dashboardContentKey(id) {
	return `content:${id}`
}

export function dashboardPanelKey(id) {
	return `panel:${id}`
}

export function normalizeDashboardRightOrder(savedOrder = [], contentLayout = {}, panelLayout = []) {
	const contentRight = Array.isArray(contentLayout?.right) ? contentLayout.right : []
	const availableKeys = new Set([
		...contentRight.map(item => dashboardContentKey(item.id)),
		...panelLayout.map(item => dashboardPanelKey(item.id)),
	])
	const ordered = []

	for (const key of Array.isArray(savedOrder) ? savedOrder : []) {
		if (!availableKeys.has(key) || ordered.includes(key)) continue
		ordered.push(key)
	}

	for (const key of availableKeys) {
		if (!ordered.includes(key)) ordered.push(key)
	}

	return ordered
}

export function dashboardRightColumnItems(contentLayout = {}, panelLayout = [], savedOrder = []) {
	const contentByKey = new Map((contentLayout.right ?? []).map(item => [dashboardContentKey(item.id), item]))
	const panelByKey = new Map(panelLayout.map(item => [dashboardPanelKey(item.id), item]))

	return normalizeDashboardRightOrder(savedOrder, contentLayout, panelLayout)
		.map((key) => {
			if (contentByKey.has(key)) {
				return { key, type: 'content', item: contentByKey.get(key) }
			}
			if (panelByKey.has(key)) {
				return { key, type: 'panel', item: panelByKey.get(key) }
			}
			return null
		})
		.filter(Boolean)
}

export function normalizeActivityLayout(savedLayout = {}) {
	return normalizeColumnLayout(savedLayout, ACTIVITY_MODULES)
}

export function activityModuleLabel(id) {
	return ACTIVITY_MODULES.find(module => module.id === id)?.label ?? id
}
