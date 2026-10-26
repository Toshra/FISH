import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' || import.meta.env.VITE_USE_EMULATORS === 'true'
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? 'grow-build-local' : '')

export const firebaseConfigured = Boolean(projectId && (useEmulators || import.meta.env.VITE_FIREBASE_API_KEY))

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'emulator-only-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:emulator',
}

const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

if (app && auth && db && useEmulators && !(globalThis as { __growBuildEmulators?: boolean }).__growBuildEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  ;(globalThis as { __growBuildEmulators?: boolean }).__growBuildEmulators = true
}

export function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured. Use the local emulators or add a Firebase web configuration.')
  return { auth, db }
}
