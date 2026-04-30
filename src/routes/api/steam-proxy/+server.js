import { error, json } from '@sveltejs/kit'

const ALLOWED_HOSTS = new Set([
    'api.steampowered.com',
    'store.steampowered.com',
    'hltbapi.codepotatoes.de',
])
const PROXY_TIMEOUT_MS = 15_000

function parseTargetUrl(endpoint) {
    if (!endpoint) throw error(400, 'Missing "endpoint" query parameter.')

    let url
    try {
        url = new URL(endpoint)
    } catch {
        throw error(400, 'Invalid endpoint URL.')
    }

    if (url.protocol !== 'https:') {
        throw error(400, 'Endpoint must use https.')
    }
    if (!ALLOWED_HOSTS.has(url.hostname)) {
        throw error(403, 'Endpoint host is not allowed.')
    }
    return url
}

export async function GET({ url }) {
    const target = parseTargetUrl(url.searchParams.get('endpoint'))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)

    let response
    try {
        response = await fetch(target, { signal: controller.signal })
    } catch (err) {
        if (err?.name === 'AbortError') throw error(504, 'Steam proxy request timed out.')
        throw error(502, 'Steam proxy request failed.')
    } finally {
        clearTimeout(timeout)
    }

    const text = await response.text()

    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { text }
    }

    return json(data, { status: response.status })
}
