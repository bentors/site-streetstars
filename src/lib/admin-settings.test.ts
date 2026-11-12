import { describe, expect, it } from 'vitest'
import { settingsFormSchema, settingsToForm } from './admin-settings'
import { DEFAULT_STORE_SETTINGS } from './store-settings'

describe('settingsFormSchema', () => {
  it('normaliza dígitos e medidas', () => {
    expect(
      settingsFormSchema.parse({
        ...settingsToForm(DEFAULT_STORE_SETTINGS),
        whatsapp: '+55 (11) 98765-4321',
        cnpj: '12.345.678/0001-90',
        originCep: '04807-010',
        heightCm: '5,5',
      }),
    ).toMatchObject({
      whatsapp: '5511987654321',
      cnpj: '12345678000190',
      originCep: '04807010',
      package: { heightCm: 5.5, widthCm: 30, lengthCm: 30 },
    })
  })

  it.each([
    [{ originCep: '123' }, 'originCep'],
    [{ email: 'x' }, 'email'],
    [{ widthCm: '0' }, 'widthCm'],
  ])('%j → erro em %s', (patch, path) => {
    const result = settingsFormSchema.safeParse({
      ...settingsToForm(DEFAULT_STORE_SETTINGS),
      ...patch,
    })
    expect(result.error?.issues.some((issue) => issue.path[0] === path)).toBe(true)
  })

  it.each([
    ['11 98765-4321', '5511987654321'],
    ['(11) 3333-4444', '551133334444'],
    ['+55 11 98765-4321', '5511987654321'],
    ['', ''],
  ])('WhatsApp %s → %s', (input, digits) => {
    expect(
      settingsFormSchema.parse({ ...settingsToForm(DEFAULT_STORE_SETTINGS), whatsapp: input })
        .whatsapp,
    ).toBe(digits)
  })

  it('WhatsApp curto demais é recusado', () => {
    const result = settingsFormSchema.safeParse({
      ...settingsToForm(DEFAULT_STORE_SETTINGS),
      whatsapp: '98765-4321',
    })
    expect(result.error?.issues[0]?.path).toEqual(['whatsapp'])
  })

  it('ida e volta', () => {
    expect(settingsFormSchema.parse(settingsToForm(DEFAULT_STORE_SETTINGS))).toEqual(
      DEFAULT_STORE_SETTINGS,
    )
  })
})
