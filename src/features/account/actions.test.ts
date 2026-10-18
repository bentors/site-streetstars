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
const users = vi.hoisted(() => ({
  saveProfile: vi.fn(),
  addUserAddress: vi.fn(),
  updateUserAddress: vi.fn(),
  removeUserAddress: vi.fn(),
  setDefaultUserAddress: vi.fn(),
}))
vi.mock('@/server/db/users', () => users)

import {
  confirmEmailAction,
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
  updateProfileAction,
} from './actions'

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
    users.saveProfile.mockResolvedValue({ ok: true, data: {} })
    expect(await updateProfileAction(input)).toEqual({ ok: true, data: null })
    expect(users.saveProfile).toHaveBeenCalledWith(
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
    expect(users.saveProfile).not.toHaveBeenCalled()
  })
})

describe('endereços', () => {
  const address = {
    label: 'Casa',
    isDefault: true,
    cep: '20040-002',
    street: 'Rua da Assembleia',
    number: '10',
    complement: '',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'rj',
  }
  const normalized = { ...address, cep: '20040002', state: 'RJ' }

  beforeEach(() => {
    for (const fn of Object.values(users)) fn.mockResolvedValue({ ok: true, data: {} })
  })

  it('sem id cria, com id edita', async () => {
    await saveAddressAction(null, address)
    expect(users.addUserAddress).toHaveBeenCalledWith('u1', normalized, expect.any(Date))
    await saveAddressAction('a1', address)
    expect(users.updateUserAddress).toHaveBeenCalledWith('u1', 'a1', normalized, expect.any(Date))
  })

  it('repassa o erro do repositório (limite, não encontrado)', async () => {
    users.addUserAddress.mockResolvedValue({
      ok: false,
      code: 'address_limit',
      message: 'Você pode salvar até 10 endereços.',
    })
    expect(await saveAddressAction(null, address)).toMatchObject({ code: 'address_limit' })
  })

  it('recusa endereço inválido sem gravar', async () => {
    expect(await saveAddressAction(null, { ...address, cep: '1' })).toMatchObject({ ok: false })
    expect(users.addUserAddress).not.toHaveBeenCalled()
  })

  it('excluir e tornar padrão exigem id de texto', async () => {
    expect(await deleteAddressAction(42)).toMatchObject({ code: 'invalid_input' })
    await deleteAddressAction('a1')
    expect(users.removeUserAddress).toHaveBeenCalledWith('u1', 'a1', expect.any(Date))
    await setDefaultAddressAction('a1')
    expect(users.setDefaultUserAddress).toHaveBeenCalledWith('u1', 'a1', expect.any(Date))
  })
})
