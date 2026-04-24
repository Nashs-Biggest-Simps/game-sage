import { getApp, getApps, initializeApp } from 'firebase/app'
import { env } from '$env/dynamic/public'

const firebaseConfig = {
    apiKey: env.PUBLIC_FIREBASE_API_KEY,
    authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.PUBLIC_FIREBASE_DATABASE_URL,
    projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.PUBLIC_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId,
].every(Boolean)

export const app = isFirebaseConfigured
    ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
    : null
