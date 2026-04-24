import { writable } from 'svelte/store'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { syncAuthedUser } from '$lib/data'
import { app } from '$lib/firebase'

function serializeFirebaseUser(user) {
    if (!user) return null

    return {
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
        emailVerified: !!user.emailVerified,
        providerData: (user.providerData ?? []).map((provider) => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName,
            email: provider.email,
            photoURL: provider.photoURL,
        })),
        metadata: {
            creationTime: user.metadata?.creationTime ?? null,
            lastSignInTime: user.metadata?.lastSignInTime ?? null,
        },
    }
}

export const auth = app ? getAuth(app) : null
export const authReady = writable(!auth)

if (typeof window !== 'undefined') {
    if (!auth) {
        authReady.set(true)
    } else {
        onAuthStateChanged(auth, (fireUser) => {
            syncAuthedUser(serializeFirebaseUser(fireUser))
            authReady.set(true)
        })
    }
}
