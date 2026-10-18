import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getAuthAccount: vi.fn(),
  destroySession: vi.fn(),
}))
const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
)
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/server/auth/session', () => session)
const saveProfile = vi.hoisted(() => vi.fn())
vi.mock('@/server/db/users', () => ({ saveProfile }))

import { confirmEmailAction, updateProfileAction } from './actions'

beforeEach(() => {
  vi.clearAllMocks()
  session.requireUser.mockResolvedValue({ uid: 'u1', email: 'a@b.com', emailVerified: false })
})

describe('confirmEmailAction', () => {
  it('e-mail ainda não confirmado: avisa e mantém a sessão', async () => {
    session.getAuthAccount.mockResolvedValue({ emailVerified: false, hasPassword: true })
    expect(await confirmEmailAction()).toMatchObject({ ok: false, code: 'not_verified' })
    expect(session.destroySession).not.toHaveBeenCalled()
  })

  it('confirmado: encerra a sessão e pede novo login', async () => {
    session.getAuthAccount.mockResolvedValue({ emailVerified: true, hasPassword: true })
    await expect(confirmEmailAction()).rejects.toThrow('REDIRECT:/entrar?next=/conta&confirmado=1')
    expect(session.destroySession).toHaveBeenCalled()
  })
})

describe('updateProfileAction', () => {
  const input = { name: 'Ana', phone: '(11) 98765-4321', cpf: '', marketingConsent: true }

  it('salva só no uid da sessão, com dados normalizados', async () => {
    saveProfile.mockResolvedValue({ ok: true, data: {} })
    expect(await updateProfileAction(input)).toEqual({ ok: true, data: null })
    expect(saveProfile).toHaveBeenCalledWith(
      'u1',
      { name: 'Ana', phone: '11987654321', cpf: null, marketingConsent: true },
      expect.any(Date),
    )
  })

  it('recusa CPF inválido sem gravar', async () => {
    expect(await updateProfileAction({ ...input, cpf: '123' })).toMatchObject({
      ok: false,
      message: 'CPF inválido',
    })
    expect(saveProfile).not.toHaveBeenCalled()
  })
})
