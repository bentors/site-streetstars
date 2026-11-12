import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/server/db/firebase-admin'
import {
  addUserAddress,
  ensureUser,
  getUser,
  rememberCheckoutDetails,
  removeUserAddress,
  saveProfile,
  setDefaultUserAddress,
  updateUserAddress,
} from '@/server/db/users'
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

const T0 = new Date('2026-10-18T12:00:00.000Z')
const T1 = new Date('2026-10-18T13:00:00.000Z')

const address = {
  label: 'Casa',
  isDefault: false,
  cep: '20040002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'RJ',
}

function data<T>(result: { ok: true; data: T } | { ok: false; message: string }): T {
  if (!result.ok) throw new Error(result.message)
  return result.data
}

describe('saveProfile', () => {
  it('grava os dados e só data o consentimento quando ele muda', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    const first = data(
      await saveProfile(
        'u1',
        { name: 'Ana Souza', phone: '11987654321', cpf: null, marketingConsent: true },
        T0,
      ),
    )
    expect(first).toMatchObject({
      name: 'Ana Souza',
      phone: '11987654321',
      cpf: null,
      marketingConsent: { value: true, at: T0 },
      updatedAt: T0,
    })

    const second = data(
      await saveProfile('u1', { name: 'Ana', phone: null, cpf: null, marketingConsent: true }, T1),
    )
    expect(second.marketingConsent.at).toEqual(T0)
    expect(await getUser('u1')).toEqual(second)
  })

  it('perfil inexistente dá not_found', async () => {
    expect(
      await saveProfile(
        'nobody',
        { name: 'X', phone: null, cpf: null, marketingConsent: false },
        T0,
      ),
    ).toMatchObject({ ok: false, code: 'not_found' })
  })
})

describe('endereços', () => {
  it('adiciona, edita, troca o padrão e exclui', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    const [home] = data(await addUserAddress('u1', address, T0)).addresses
    expect(home).toMatchObject({ label: 'Casa', isDefault: true })
    const id = home?.id ?? ''

    const withWork = data(
      await addUserAddress('u1', { ...address, label: 'Trampo', number: '20' }, T0),
    )
    const workId = withWork.addresses[1]?.id ?? ''

    data(
      await updateUserAddress('u1', id, { ...address, complement: 'Apto 2', isDefault: true }, T1),
    )
    data(await setDefaultUserAddress('u1', workId, T1))
    const afterRemove = data(await removeUserAddress('u1', workId, T1))

    expect(afterRemove.addresses).toEqual([
      { ...address, complement: 'Apto 2', isDefault: true, id },
    ])
    expect((await getUser('u1'))?.addresses).toEqual(afterRemove.addresses)
  })

  it('editar endereço que não existe dá not_found', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    expect(await updateUserAddress('u1', 'zzz', address, T0)).toMatchObject({ code: 'not_found' })
  })
})

describe('rememberCheckoutDetails', () => {
  const checkoutAddress = {
    cep: address.cep,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
  }

  it('preenche telefone e CPF vazios e salva o endereço uma vez só', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    const details = { phone: '11987654321', cpf: '52998224725', address: checkoutAddress }
    data(await rememberCheckoutDetails('u1', details, T0))
    const again = data(await rememberCheckoutDetails('u1', details, T1))

    expect(again).toMatchObject({ phone: '11987654321', cpf: '52998224725' })
    expect(again.addresses).toHaveLength(1)
    expect(again.addresses[0]).toMatchObject({ ...checkoutAddress, label: '', isDefault: true })
  })

  it('não sobrescreve telefone e CPF já preenchidos e aceita não salvar endereço', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    data(
      await saveProfile(
        'u1',
        { name: 'Ana', phone: '21999998888', cpf: '11144477735', marketingConsent: false },
        T0,
      ),
    )
    const after = data(
      await rememberCheckoutDetails(
        'u1',
        { phone: '11987654321', cpf: '52998224725', address: null },
        T1,
      ),
    )
    expect(after).toMatchObject({ phone: '21999998888', cpf: '11144477735', addresses: [] })
  })
})
