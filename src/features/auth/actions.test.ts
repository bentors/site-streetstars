import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimit = vi.hoisted(() => vi.fn())
const createSession = vi.hoisted(() => vi.fn())
const saveProfile = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/server/ratelimit', () => ({ rateLimit, clientIp: async () => '1.2.3.4' }))
vi.mock('@/server/auth/session', () => ({ createSession, destroySession: vi.fn() }))
vi.mock('@/server/db/users', () => ({ saveProfile }))

import { signUpAction } from './actions'

const input = { name: ' Ana ', marketingConsent: true, acceptTerms: true }

beforeEach(() => {
  vi.resetAllMocks()
  rateLimit.mockResolvedValue(true)
  createSession.mockResolvedValue({ ok: true, data: { uid: 'u1' } })
  saveProfile.mockResolvedValue({ ok: true, data: {} })
})

describe('signUpAction', () => {
  it('cria a sessão e grava nome e consentimento', async () => {
    expect(await signUpAction('id-token', input)).toEqual({ ok: true, data: null })
    expect(createSession).toHaveBeenCalledWith('id-token')
    expect(saveProfile).toHaveBeenCalledWith(
      'u1',
      { name: 'Ana', phone: null, cpf: null, marketingConsent: true },
      expect.any(Date),
    )
  })

  it('recusa sem aceitar os termos, antes de criar a sessão', async () => {
    const result = await signUpAction('id-token', { ...input, acceptTerms: false })
    expect(result).toMatchObject({ ok: false, message: 'Aceite os termos para continuar.' })
    expect(createSession).not.toHaveBeenCalled()
  })

  it('respeita o rate limit', async () => {
    rateLimit.mockResolvedValue(false)
    expect(await signUpAction('id-token', input)).toMatchObject({ code: 'rate_limited' })
  })

  it('falha ao gravar o perfil não desfaz o cadastro', async () => {
    saveProfile.mockRejectedValue(new Error('firestore fora'))
    expect(await signUpAction('id-token', input)).toEqual({ ok: true, data: null })
  })
})
