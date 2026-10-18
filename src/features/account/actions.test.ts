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

import { confirmEmailAction } from './actions'

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
