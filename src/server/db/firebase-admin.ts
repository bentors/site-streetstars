import 'server-only'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { serverEnv } from '@/server/env'

function adminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const env = serverEnv()
  // Com FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST definidos, o SDK usa os emuladores.
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    })
  }
  return initializeApp({ projectId: env.FIREBASE_PROJECT_ID })
}

export function db() {
  return getFirestore(adminApp())
}

export function adminAuth() {
  return getAuth(adminApp())
}
