import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }))
const auth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}))
const ensureUser = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
vi.mock('@/server/db/firebase-admin', () => ({ adminAuth: () => auth }))
vi.mock('@/server/db/users', () => ({ ensureUser }))

import { createSession, getSessionUser, requireAdmin, requireUser } from './session'

const nowSec = () => Math.floor(Date.now() / 1000)

beforeEach(() => {
  vi.resetAllMocks()
  cookieStore.get.mockReturnValue(undefined)
})

describe('getSessionUser', () => {
  it('devolve null sem cookie', async () => {
    expect(await getSessionUser()).toBeNull()
  })

  it('lê uid, e-mail e claim de admin do cookie, checando revogação', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.com',
      email_verified: true,
      admin: true,
    })
    expect(await getSessionUser()).toEqual({
      uid: 'u1',
      email: 'a@b.com',
      emailVerified: true,
      isAdmin: true,
    })
    expect(auth.verifySessionCookie).toHaveBeenCalledWith('cookie', true)
  })

  it('devolve null se o cookie foi revogado ou o usuário desativado', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockRejectedValue(new Error('auth/session-cookie-revoked'))
    expect(await getSessionUser()).toBeNull()
  })
})

describe('requireUser / requireAdmin', () => {
  it('requireUser redireciona para /entrar com o destino', async () => {
    await expect(requireUser('/conta/pedidos')).rejects.toThrow(
      'REDIRECT:/entrar?next=%2Fconta%2Fpedidos',
    )
  })

  it('requireAdmin redireciona quem não está logado', async () => {
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/entrar?next=%2Fadmin')
  })

  it('requireAdmin responde 404 para usuário comum', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockResolvedValue({ uid: 'u1', email: 'a@b.com' })
    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND')
  })
})

describe('createSession', () => {
  it('recusa ID token de login antigo, sem gravar cookie', async () => {
    auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', auth_time: nowSec() - 600 })
    const result = await createSession('token')
    expect(result).toEqual({
      ok: false,
      code: 'recent_login_required',
      message: 'Sua sessão expirou. Entre novamente.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('recusa token inválido', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('auth/argument-error'))
    const result = await createSession('lixo')
    expect(result.ok).toBe(false)
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('não grava cookie se o perfil não puder ser garantido', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', auth_time: nowSec() })
    auth.createSessionCookie.mockResolvedValue('session-cookie')
    ensureUser.mockRejectedValue(new Error('firestore indisponível'))

    expect(await createSession('token')).toEqual({
      ok: false,
      code: 'session_failed',
      message: 'Não foi possível entrar. Tente novamente.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('não grava cookie se o Firebase recusar criar a sessão', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', auth_time: nowSec() })
    auth.createSessionCookie.mockRejectedValue(new Error('auth/internal-error'))

    const result = await createSession('token')
    expect(result.ok).toBe(false)
    expect(cookieStore.set).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('grava cookie httpOnly e garante o perfil do usuário', async () => {
    auth.verifyIdToken.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.com',
      name: 'Ana',
      auth_time: nowSec(),
    })
    auth.createSessionCookie.mockResolvedValue('session-cookie')

    expect(await createSession('token')).toEqual({ ok: true, data: { uid: 'u1' } })
    expect(auth.createSessionCookie).toHaveBeenCalledWith('token', { expiresIn: 432000 * 1000 })
    expect(cookieStore.set).toHaveBeenCalledWith(
      '__session',
      'session-cookie',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 432000 }),
    )
    expect(ensureUser).toHaveBeenCalledWith({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
  })
})
