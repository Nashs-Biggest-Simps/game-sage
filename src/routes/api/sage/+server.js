import { error, json } from '@sveltejs/kit'
import { RueterModel } from 'rueter-ai'
import { env } from '$env/dynamic/private'

const GROK_API_KEY = env.GROK_API_KEY ?? ''

function buildPrompt(type, profile, candidates) {
    const modeLine = type === 'play'
        ? 'You explain why an already-owned Steam game is a strong next pick.'
        : 'You explain why a Steam store game is a strong buy/watchlist candidate.'

    return [
        modeLine,
        'Write exactly one short, concrete sentence per candidate.',
        'Return strict JSON with the shape {"reasons":[{"id":123,"reason":"..."}, ...]}.',
        'Do not add markdown.',
        '',
        'USER PROFILE',
        profile,
        '',
        'CANDIDATES',
        ...candidates.map((candidate) => {
            const genres = (candidate.genres ?? []).join(', ') || 'unknown'
            return `${candidate.id}|${candidate.name}|genres=${genres}|score=${candidate.score}|source=${candidate.sourceLabel}`
        }),
    ].join('\n')
}

function extractJSON(raw) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    return JSON.parse((fenced ? fenced[1] : raw).trim())
}

export async function POST({ request }) {
    const body = await request.json().catch(() => null)
    const { type, profile, candidates } = body ?? {}

    if (type !== 'play' && type !== 'buy') throw error(400, '"type" must be "play" or "buy".')
    if (!profile?.trim()) throw error(400, '"profile" is required.')
    if (!Array.isArray(candidates) || candidates.length === 0) throw error(400, '"candidates" is required.')
    if (!GROK_API_KEY) throw error(503, 'AI service is not configured.')

    const model = new RueterModel('grok', GROK_API_KEY, 1)
    model.setSystemPrompt('You are a precise recommendation copywriter for a Steam companion app.')
    model.setMaxTokens(600)
    model.setTemperature(0.4)

    let raw
    try {
        raw = await model.prompt(buildPrompt(type, profile, candidates))
    } catch (cause) {
        console.error('[/api/sage] AI call failed:', cause)
        throw error(502, 'AI call failed.')
    }

    try {
        const parsed = extractJSON(raw)
        return json(parsed)
    } catch (cause) {
        console.error('[/api/sage] Malformed AI response:', raw, cause)
        throw error(502, 'AI returned malformed JSON.')
    }
}
