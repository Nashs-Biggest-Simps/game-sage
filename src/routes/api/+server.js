


import { json } from '@sveltejs/kit'

export async function GET({ url }) {
	const endpoint = decodeURIComponent(url.search?.split("?endpoint=")[1])

	const res = await fetch(endpoint)
	const data = await res.json()

	return json(data)
}