import { deleteApp, initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth'
import { afterAll, describe, expect, it } from 'vitest'
import { adminAuth } from '@/server/db/firebase-admin'

// Reproduz no emulador o fluxo de change-password-form: o cookie novo precisa sobreviver
// à revogação que a troca de senha faz (tokensValidAfterTime).
const app = initializeApp({ apiKey: 'test', projectId: 'demo-streetstars' }, 'password-change')
const auth = getAuth(app)
connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
  disableWarnings: true,
})

afterAll(() => deleteApp(app))

describe('troca de senha', () => {
  it('o cookie criado do token novo continua válido com checagem de revogação', async () => {
    await setPersistence(auth, inMemoryPersistence)
    const email = `troca-${Date.now()}@exemplo.com`
    await createUserWithEmailAndPassword(auth, email, 'antiga123')
    await signOut(auth)

    const { user } = await signInWithEmailAndPassword(auth, email, 'antiga123')
    // Login e troca em segundos diferentes: é aí que auth_time < validSince quebraria.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await updatePassword(user, 'novinha456')

    // Token da sessão antiga: auth_time anterior à troca, então nasce revogado.
    const stale = await adminAuth().createSessionCookie(await user.getIdToken(true), {
      expiresIn: 60 * 60 * 1000,
    })
    await expect(adminAuth().verifySessionCookie(stale, true)).rejects.toMatchObject({
      code: 'auth/session-cookie-revoked',
    })

    // O que o formulário faz: entra de novo com a senha nova e usa esse token.
    const fresh = await signInWithEmailAndPassword(auth, email, 'novinha456')
    const cookie = await adminAuth().createSessionCookie(await fresh.user.getIdToken(), {
      expiresIn: 60 * 60 * 1000,
    })
    await expect(adminAuth().verifySessionCookie(cookie, true)).resolves.toMatchObject({
      uid: user.uid,
    })
  })
})
