process.env.FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.GCLOUD_PROJECT ??= 'demo-streetstars'
// Sem credenciais no emulador, o google-auth tenta o servidor de metadados do GCP e espera o timeout.
process.env.METADATA_SERVER_DETECTION ??= 'none'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Testes de integração exigem o emulador: rode `npm run test:emulator`.')
}
