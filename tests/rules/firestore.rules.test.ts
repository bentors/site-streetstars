import { readFileSync } from 'node:fs'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, describe, it } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-streetstars',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

const paths = [
  'products/p1',
  'collections/c1',
  'users/u1',
  'orders/o1',
  'coupons/ESTRELA10',
  'counters/orders',
  'settings/store',
]

describe.each(paths)('%s', (path) => {
  it('nega leitura anônima', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), path)))
  })

  it('nega leitura do próprio usuário', async () => {
    await assertFails(getDoc(doc(env.authenticatedContext('u1').firestore(), path)))
  })

  it('nega escrita mesmo com claim de admin', async () => {
    const db = env.authenticatedContext('admin', { admin: true }).firestore()
    await assertFails(setDoc(doc(db, path), { hacked: true }))
  })
})
