// /api/sage — server-side Claude endpoint
// Accepts a compact user profile string and returns ranked game appid suggestions.
// Runs server-side so the Anthropic API key is never exposed to the client.

import { json, error } from '@sveltejs/kit'
import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_API_KEY } from '$env/static/private'

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const SYSTEM_PROMPT =
    'You are a game recommendation engine. ' +
    'Analyze the user\'s Steam play history and return only valid JSON — ' +
    'no markdown, no explanation, no code fences. ' +
    'The response must match exactly: {"s":[appid,...]}'

export async function POST({ request }) {
    const body = await request.json().catch(() => null)
    const profile = body?.profile

    if (typeof profile !== 'string' || profile.trim().length === 0) {
        throw error(400, 'Request body must include a non-empty "profile" string.')
    }

    let raw
    try {
        const message = await client.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 256,
            system:     SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: profile }],
        })
        raw = message.content[0]?.text?.trim() ?? ''
    } catch (upstreamErr) {
        console.error('[/api/sage] Anthropic API error:', upstreamErr)
        throw error(502, 'Upstream Claude API call failed.')
    }

    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch {
        console.error('[/api/sage] Claude returned malformed JSON:', raw)
        throw error(502, `Claude returned malformed JSON: ${raw.slice(0, 200)}`)
    }

    if (!Array.isArray(parsed?.s)) {
        console.error('[/api/sage] Unexpected response shape:', parsed)
        throw error(502, 'Claude response did not match expected shape { s: number[] }.')
    }

    return json(parsed)
}
