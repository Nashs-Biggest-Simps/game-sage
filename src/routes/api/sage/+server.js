import { json, error } from '@sveltejs/kit'
import { RueterModel } from 'rueter-ai'
import { GROK_API_KEY } from '$env/static/private'

const PLAY_PROMPT =
    'You are a precise Steam library curation engine. ' +
    'Your task is to choose owned games the user should play next from UNPLAYED_OWNED only. ' +
    'Only pick listed appids. Never invent titles, never pick DLC/demos when the list indicates them, and never pick from PLAYED unless also listed in UNPLAYED_OWNED. ' +
    'Rank by fit using genre affinity, high-playtime patterns, recent activity, quality signals, and variety. ' +
    'Prefer strong matches over novelty, but avoid clustering every pick in one franchise or genre. ' +
    'If USER_FEEDBACK is present, prioritize liked patterns and avoid disliked ones. ' +
    'Return ONLY valid JSON with no markdown, code fences, or explanation. ' +
    'Format exactly: {"s":[{"id":<appid>,"r":"<one-sentence reason>"},...]} — return 12 results when possible, never fewer than 8 unless the input list has fewer than 8 viable games.'

const BUY_PROMPT =
    'You are a precise Steam store discovery engine. ' +
    'Suggest games the user does not own and would likely buy or wishlist. ' +
    'Only suggest real, currently purchasable base games on Steam using exact Steam store titles. ' +
    'Do not suggest anything from ALREADY_OWNED. Avoid DLC, soundtracks, demos, bundles, editions, duplicate franchises, and direct sequels when the user already owns the closest prerequisite unless it is clearly the best modern entry point. ' +
    'Rank by taste fit using playtime patterns, genre affinity, recent activity, quality/reputation, and freshness. Mix reliable high-confidence picks with a few tasteful discoveries. ' +
    'If FRIENDS_PLAYING is present, those are games friends are actively playing that the user does not own — prioritize recommending them if they match the user\'s taste. ' +
    'If USER_FEEDBACK is present, match liked patterns and avoid disliked ones. ' +
    'Return ONLY valid JSON with no markdown, code fences, or explanation. ' +
    'Format exactly: {"b":[{"n":"<exact Steam title>","r":"<one-sentence reason>"},...]} — return 12 results when possible, never fewer than 8.'

function buildSystemPrompt(type, prefs) {
    let prompt = type === 'play' ? PLAY_PROMPT : BUY_PROMPT

    const preferred = prefs?.genres?.preferred ?? []
    const excluded  = prefs?.genres?.excluded  ?? []
    const tone      = prefs?.suggestions?.aiTone ?? 'brief'

    if (preferred.length) prompt += ` Prefer these genres: ${preferred.join(', ')}.`
    if (excluded.length)  prompt += ` Avoid these genres: ${excluded.join(', ')}.`
    if (tone === 'detailed')      prompt += ` Write reasons in 2 sentences with specific details.`
    if (tone === 'enthusiastic')  prompt += ` Write reasons with enthusiasm and energy.`

    return prompt
}

// Strip markdown code fences in case the AI wraps the JSON response
function extractJSON(raw) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    return JSON.parse((fenced ? fenced[1] : raw).trim())
}

export async function POST({ request }) {
    const body = await request.json().catch(() => null)
    const { type, profile, prefs } = body ?? {}

    if (!profile?.trim()) throw error(400, '"profile" is required.')
    if (type !== 'play' && type !== 'buy') throw error(400, '"type" must be "play" or "buy".')

    const model = new RueterModel('grok', GROK_API_KEY, 1)
    model.setSystemPrompt(buildSystemPrompt(type, prefs))
    model.setMaxTokens(type === 'play' ? 900 : 900)
    model.setTemperature(type === 'play' ? 0.45 : 0.55)

    let raw
    try {
        raw = await model.prompt(profile)
    } catch (err) {
        console.error('[/api/sage] AI call failed:', err)
        throw error(502, 'AI call failed.')
    }

    let parsed
    try {
        parsed = extractJSON(raw)
    } catch {
        console.error('[/api/sage] Malformed AI response:', raw)
        throw error(502, 'AI returned malformed JSON.')
    }

    if (type === 'play' && !Array.isArray(parsed?.s)) {
        console.error('[/api/sage] Unexpected play shape:', parsed)
        throw error(502, 'AI play response did not match expected shape.')
    }
    if (type === 'buy' && !Array.isArray(parsed?.b)) {
        console.error('[/api/sage] Unexpected buy shape:', parsed)
        throw error(502, 'AI buy response did not match expected shape.')
    }

    return json(parsed)
}
