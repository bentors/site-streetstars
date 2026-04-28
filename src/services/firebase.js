import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore/lite'
import { getFirestore as getFirestoreRealtime } from 'firebase/firestore' // ← adiciona
import { getAuth } from 'firebase/auth'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
]

const missingVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
)

if (missingVars.length > 0 && import.meta.env.DEV) {
  console.error('❌ Variáveis de ambiente faltando:', missingVars)
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app, db, dbRealtime, auth

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)                    // lite — para leituras simples
  dbRealtime = getFirestoreRealtime(app)    // completo — só para onSnapshot
  auth = getAuth(app)

  if (import.meta.env.DEV) {
    console.log('Firebase inicializado com sucesso')
  }
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error)
}

export { db, dbRealtime, auth, app }