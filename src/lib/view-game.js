/**
 * @param {number | null | undefined} value
 */
export function formatHltb(value) {
    if (!value) return null
    const hours = Math.trunc(value)
    const minutes = Math.round((value % 1) * 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * @param {number} unix
 */
export function formatNewsDate(unix) {
    return new Date(unix * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

/**
 * @param {string | null | undefined} html
 */
export function stripHtml(html) {
    return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
