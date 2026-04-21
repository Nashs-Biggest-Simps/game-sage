import { json, error } from '@sveltejs/kit'
import { RueterModel } from 'rueter-ai'
import { ANTHROPIC_API_KEY } from '$env/static/private'

const PLAY_BASE =
    'You are a precision game recommendation engine for Steam. ' +
    'Given a user\'s play history, select games from their UNPLAYED_OWNED list that best match their taste. ' +
    'Only pick from UNPLAYED_OWNED using the listed appid. ' +
    'Factor in genre affinity, playtime investment, and recent activity. ' +
    'Ensure variety across genres — do not cluster all picks in one genre. ' +
    'If USER_FEEDBACK is present, prioritize liked patterns and avoid disliked ones. ' +
    'Return ONLY valid JSON with no markdown, code fences, or explanation. ' +
    'Format exactly: {"s":[{"id":<appid>,"r":"<one-sentence reason>"},...]} — up to 12 results, confidence order.'

const BUY_BASE =
    'You are a game discovery expert for Steam. ' +
    'Given a user\'s play history, suggest games they do not own but would enjoy. ' +
    'Only suggest real, currently purchasable Steam games — use their exact Steam store titles. ' +
    'Do not suggest anything from ALREADY_OWNED, or sequels/DLC of games in PLAYED. ' +
    'Mix well-known titles with hidden gems. ' +
    'If USER_FEEDBACK is present, match liked patterns and avoid disliked ones. ' +
    'Return ONLY valid JSON with no markdown, code fences, or explanation. ' +
    'Format exactly: {"b":[{"n":"<exact Steam title>","r":"<one-sentence reason>"},...]} — up to 8 results, confidence order.'

function buildSystemPrompt(type, prefs) {
    let prompt = type === 'play' ? PLAY_BASE : BUY_BASE

    const preferred = prefs?.genres?.preferred ?? []
    const excluded  = prefs?.genres?.excluded  ?? []
    const tone      = prefs?.suggestions?.aiTone ?? 'brief'

    if (preferred.length) prompt += ` User has indicated they prefer these genres: ${preferred.join(', ')} — weight your picks toward these.`
    if (excluded.length)  prompt += ` User dislikes these genres: ${excluded.join(', ')} — avoid suggesting games primarily in those genres.`

    if (tone === 'detailed')      prompt += ` Write reasons in 2 sentences, being specific about what makes the game a good fit.`
    else if (tone === 'enthusiastic') prompt += ` Write reasons with enthusiasm and energy — make the game sound exciting and fun.`

    return prompt
}

export async function POST({ request }) {
    const body = await request.json().catch(() => null)
    const { type, profile, prefs } = body ?? {}

    if (!profile?.trim()) {
        throw error(400, 'Body must include a non-empty "profile" string.')
    }
    if (type !== 'play' && type !== 'buy') {
        throw error(400, '"type" must be "play" or "buy".')
    }

    const model = new RueterModel('anthropic', ANTHROPIC_API_KEY)
    model.setSystemPrompt(buildSystemPrompt(type, prefs))
    model.setMaxTokens(type === 'play' ? 512 : 384)
    model.setTemperature(0.7)

    let raw
    try {
        raw = await model.prompt(profile)
    } catch (err) {
        console.error('[/api/sage] rueter-ai error:', err)
        throw error(502, 'AI call failed.')
    }

    let parsed
    try {
        parsed = JSON.parse(raw.trim())
    } catch {
        console.error('[/api/sage] Malformed JSON from AI:', raw)
        throw error(502, `AI returned malformed JSON: ${raw.slice(0, 200)}`)
    }

    if (type === 'play' && !Array.isArray(parsed?.s)) {
        console.error('[/api/sage] Play response shape mismatch:', parsed)
        throw error(502, 'AI play response did not match expected shape { s: [{id,r},...] }.')
    }
    if (type === 'buy' && !Array.isArray(parsed?.b)) {
        console.error('[/api/sage] Buy response shape mismatch:', parsed)
        throw error(502, 'AI buy response did not match expected shape { b: [{n,r},...] }.')
    }

    return json(parsed)
}
