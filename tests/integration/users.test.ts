import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/server/db/firebase-admin'
import { ensureUser, getUser } from '@/server/db/users'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

describe('users repository', () => {
  it('getUser devolve null para quem não existe', async () => {
    expect(await getUser('nobody')).toBeNull()
  })

  it('ensureUser cria o perfil com valores padrão', async () => {
    const user = await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    expect(user).toMatchObject({
      name: 'Ana',
      email: 'a@b.com',
      phone: null,
      cpf: null,
      addresses: [],
      marketingConsent: { value: false },
    })
    expect(await getUser('u1')).toEqual(user)
  })

  it('ensureUser não sobrescreve um perfil existente', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    await db().doc('users/u1').update({ name: 'Ana Maria' })
    const again = await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Outro Nome' })
    expect(again.name).toBe('Ana Maria')
  })

  it('ensureUser aceita nome ausente (login sem nome)', async () => {
    const user = await ensureUser({ uid: 'u2', email: 'c@d.com', name: null })
    expect(user.name).toBe('')
  })
})
