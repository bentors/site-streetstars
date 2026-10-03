import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserPopupRedirectResolver,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
import { publicEnv } from '@/lib/env'

let auth: Auth | undefined

/** Firebase no navegador serve só para autenticar; a sessão real é o cookie do servidor. */
export function clientAuth(): Auth {
  if (auth) return auth
  const env = publicEnv()
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
  // Síncrono de propósito: signInWithPopup precisa rodar no mesmo tique do clique.
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
  return auth
}
