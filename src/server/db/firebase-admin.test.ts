import { beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
const app = vi.hoisted(() => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({})),
  cert: vi.fn(() => ({})),
}))

vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))
vi.mock('firebase-admin/app', () => app)
vi.mock('firebase-admin/firestore', () => ({ getFirestore: vi.fn(() => ({})) }))
vi.mock('firebase-admin/auth', () => ({ getAuth: vi.fn(() => ({})) }))

import { db } from './firebase-admin'

beforeEach(() => vi.clearAllMocks())

describe('adminApp', () => {
  it('no emulador ignora credenciais, mesmo que existam (CI define valores falsos)', () => {
    env.value = {
      FIREBASE_PROJECT_ID: 'demo-streetstars',
      FIREBASE_CLIENT_EMAIL: 'ci@demo.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'ci',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    }
    db()
    expect(app.cert).not.toHaveBeenCalled()
    expect(app.initializeApp).toHaveBeenCalledWith({ projectId: 'demo-streetstars' })
  })

  it('fora do emulador usa a conta de serviço', () => {
    env.value = {
      FIREBASE_PROJECT_ID: 'street-stars-system',
      FIREBASE_CLIENT_EMAIL: 'sa@x.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'key',
    }
    db()
    expect(app.cert).toHaveBeenCalledWith({
      projectId: 'street-stars-system',
      clientEmail: 'sa@x.iam.gserviceaccount.com',
      privateKey: 'key',
    })
  })
})
