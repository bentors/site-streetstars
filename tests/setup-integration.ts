process.env.FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.GCLOUD_PROJECT ??= 'demo-streetstars'
// Sem credenciais no emulador, o google-auth tenta o servidor de metadados do GCP e espera o timeout.
process.env.METADATA_SERVER_DETECTION ??= 'none'
process.env.ORDER_TOKEN_SECRET ??= 'integration-order-token-secret-32chars!'
// publicEnv() monta as URLs de pedido e de webhook.
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000'
process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??= 'demo-streetstars.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??= 'test'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Testes de integração exigem o emulador: rode `npm run test:emulator`.')
}
