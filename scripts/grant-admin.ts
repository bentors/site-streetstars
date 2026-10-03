// Uso: npm run grant-admin -- pessoa@exemplo.com
// Roda fora do Next, por isso inicializa o Admin SDK por conta própria (sem 'server-only').
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Uso: npm run grant-admin -- <email>')
    process.exit(1)
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error(
      'Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local',
    )
    process.exit(1)
  }

  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })

  const auth = getAuth()
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true })
  // Invalida a sessão atual: o próximo login já carrega a claim de admin.
  await auth.revokeRefreshTokens(user.uid)

  console.log(
    `✓ ${email} agora é admin no projeto ${FIREBASE_PROJECT_ID}. Peça para entrar novamente.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
