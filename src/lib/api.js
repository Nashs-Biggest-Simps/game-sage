// API Handler File
import { db } from "$lib/data"

export async function getGameDetails(appId) {
    const [detailsRes, reviewRes] = await Promise.all([
        fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`),
        fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all`)
    ])

    const detailsData = await detailsRes.json()
    const reviewData = await reviewRes.json()
    const game = detailsData[appId].data
    const reviews = reviewData.query_summary

    return {
        title: game.name,
        genres: game.genres?.map(g => g.description) ?? [],
        tags: game.categories?.map(c => c.description) ?? [],
        developer: game.developers?.[0] ?? "Unknown",
        rating: {
            label: reviews.review_score_desc,
            score: reviews.review_score,
            positive: reviews.total_positive,
            negative: reviews.total_negative,
            total: reviews.total_reviews,
        },
        releaseDate: game.release_date?.date ?? "Unknown",
    }
}
