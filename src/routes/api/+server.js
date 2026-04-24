import { error, json } from '@sveltejs/kit'
import { fetchSteamAction } from '$lib/server/steam-api'

export async function GET({ url }) {
    const action = url.searchParams.get('action')

    if (!action) {
        throw error(400, 'Missing "action" query parameter.')
    }

    try {
        const data = await fetchSteamAction(action, url.searchParams)
        return json(data)
    } catch (cause) {
        console.error(`[/api] ${action} failed:`, cause)
        throw error(502, cause instanceof Error ? cause.message : 'Upstream request failed.')
    }
}
