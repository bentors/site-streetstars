process.env.FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.GCLOUD_PROJECT ??= 'demo-streetstars'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Testes de integração exigem o emulador: rode `npm run test:emulator`.')
}
