import { describe, expect, it } from 'vitest'
import { addressInputSchema, passwordProblem, profileSchema, signUpSchema } from './account'

describe('passwordProblem', () => {
  it.each([
    ['abc123', 'Use pelo menos 8 caracteres.'],
    ['abcdefgh', 'Use letras e números.'],
    ['12345678', 'Use letras e números.'],
    ['a1'.repeat(65), 'Senha muito longa.'],
  ])('%s → %s', (password, message) => {
    expect(passwordProblem(password)).toBe(message)
  })

  it('aceita 8+ caracteres com letra e número', () => {
    expect(passwordProblem('estrela42')).toBeNull()
  })
})

describe('signUpSchema', () => {
  it('exige aceitar os termos', () => {
    const result = signUpSchema.safeParse({
      name: 'Ana',
      marketingConsent: false,
      acceptTerms: false,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Aceite os termos para continuar.')
  })

  it('apara o nome', () => {
    expect(
      signUpSchema.parse({ name: '  Ana  ', marketingConsent: true, acceptTerms: true }),
    ).toEqual({ name: 'Ana', marketingConsent: true, acceptTerms: true })
  })
})

describe('profileSchema', () => {
  it('normaliza telefone e CPF preenchidos', () => {
    expect(
      profileSchema.parse({
        name: 'Ana',
        phone: '(11) 98765-4321',
        cpf: '529.982.247-25',
        marketingConsent: false,
      }),
    ).toEqual({ name: 'Ana', phone: '11987654321', cpf: '52998224725', marketingConsent: false })
  })

  it('vazio vira null', () => {
    expect(
      profileSchema.parse({ name: 'Ana', phone: '', cpf: '  ', marketingConsent: false }),
    ).toMatchObject({ phone: null, cpf: null })
  })

  it('recusa CPF e telefone inválidos', () => {
    const result = profileSchema.safeParse({
      name: 'Ana',
      phone: '123',
      cpf: '111.111.111-11',
      marketingConsent: false,
    })
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Telefone inválido',
      'CPF inválido',
    ])
  })
})

describe('addressInputSchema', () => {
  it('reaproveita as regras do checkout e limita o apelido', () => {
    const result = addressInputSchema.safeParse({
      label: 'x'.repeat(31),
      isDefault: false,
      cep: '20040-002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'rj',
    })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['label'])
  })
})
