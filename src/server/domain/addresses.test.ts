import { describe, expect, it } from 'vitest'
import type { AddressInput, SavedAddress } from '@/lib/account'
import {
  addAddress,
  removeAddress,
  sameAddress,
  setDefaultAddress,
  updateAddress,
} from './addresses'

const input = (overrides: Partial<AddressInput> = {}): AddressInput => ({
  label: '',
  isDefault: false,
  cep: '20040002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'RJ',
  ...overrides,
})
const saved = (id: string, isDefault = false): SavedAddress => ({ ...input({ isDefault }), id })
const defaults = (list: SavedAddress[]) => list.filter((a) => a.isDefault).map((a) => a.id)

function unwrap<T>(result: { ok: true; data: T } | { ok: false }): T {
  if (!result.ok) throw new Error('esperava ok')
  return result.data
}

describe('addAddress', () => {
  it('o primeiro endereço vira padrão mesmo sem pedir', () => {
    expect(defaults(unwrap(addAddress([], input(), 'a')))).toEqual(['a'])
  })

  it('novo sem padrão mantém o padrão atual', () => {
    expect(defaults(unwrap(addAddress([saved('a', true)], input(), 'b')))).toEqual(['a'])
  })

  it('novo marcado como padrão tira o padrão do anterior', () => {
    const list = unwrap(addAddress([saved('a', true)], input({ isDefault: true }), 'b'))
    expect(defaults(list)).toEqual(['b'])
  })

  it('recusa o 11º endereço', () => {
    const full = Array.from({ length: 10 }, (_, i) => saved(String(i), i === 0))
    expect(addAddress(full, input(), 'x')).toMatchObject({ ok: false, code: 'address_limit' })
  })
})

describe('updateAddress', () => {
  it('substitui os campos e mantém o id', () => {
    const list = unwrap(updateAddress([saved('a', true)], 'a', input({ number: '99' })))
    expect(list).toEqual([{ ...input({ number: '99', isDefault: true }), id: 'a' }])
  })

  it('desmarcar o único padrão não deixa a lista sem padrão', () => {
    const list = unwrap(
      updateAddress([saved('a', true), saved('b')], 'a', input({ isDefault: false })),
    )
    expect(defaults(list)).toHaveLength(1)
  })

  it('id que não existe dá not_found', () => {
    expect(updateAddress([saved('a', true)], 'zzz', input())).toMatchObject({
      ok: false,
      code: 'not_found',
    })
  })
})

describe('removeAddress', () => {
  it('excluir o padrão promove outro', () => {
    expect(defaults(removeAddress([saved('a', true), saved('b')], 'a'))).toEqual(['b'])
  })

  it('excluir o último deixa a lista vazia', () => {
    expect(removeAddress([saved('a', true)], 'a')).toEqual([])
  })

  it('id desconhecido não muda nada', () => {
    const list = [saved('a', true)]
    expect(removeAddress(list, 'zzz')).toEqual(list)
  })
})

describe('setDefaultAddress', () => {
  it('troca o padrão', () => {
    expect(defaults(unwrap(setDefaultAddress([saved('a', true), saved('b')], 'b')))).toEqual(['b'])
  })

  it('id desconhecido dá not_found', () => {
    expect(setDefaultAddress([saved('a', true)], 'zzz')).toMatchObject({ code: 'not_found' })
  })
})

describe('sameAddress', () => {
  it('ignora maiúsculas e espaços nas pontas', () => {
    expect(sameAddress(input(), input({ street: ' rua da assembleia ', complement: '' }))).toBe(
      true,
    )
  })

  it('número ou complemento diferente é outro endereço', () => {
    expect(sameAddress(input(), input({ number: '11' }))).toBe(false)
    expect(sameAddress(input(), input({ complement: 'Apto 2' }))).toBe(false)
  })
})
