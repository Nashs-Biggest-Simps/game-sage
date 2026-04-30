import { error, json } from '@sveltejs/kit'

function parseTargetUrl(endpoint) {
    if (!endpoint) throw error(400, 'Missing "endpoint" query parameter.')

    try {
        const url = new URL(endpoint)
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            throw error(400, 'Endpoint must use http or https.')
        }
        return url
    } catch {
        throw error(400, 'Invalid endpoint URL.')
    }
}

export async function GET({ url }) {
    const target = parseTargetUrl(url.searchParams.get('endpoint'))
    const response = await fetch(target)
    const text = await response.text()

    let data
    try {
        data = JSON.parse(text)
    } catch {
        data = { text }
    }

    return json(data, { status: response.status })
}
