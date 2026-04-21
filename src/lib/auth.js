import { writable } from 'svelte/store'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '$lib/data'
import { app } from '$lib/firebase'

export const auth     = getAuth(app)
export const authReady = writable(false)

if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, (fireuser) => {
        if (fireuser) {
            db.update(data => {
                data.user = fireuser
                return data
            })
        } else {
            db.update(data => {
                data.user = {}
                return data
            })
        }
        authReady.set(true)
    })
}
