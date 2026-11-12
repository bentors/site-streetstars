import { describe, expect, it } from 'vitest'
import { couponFormSchema, couponToForm, couponUpdateSchema } from './admin-coupon'

const base = { ...couponToForm(null), code: ' bemvindo10 ', value: '10' }

describe('couponFormSchema', () => {
  it('percentual com datas no horário de São Paulo', () => {
    expect(
      couponFormSchema.parse({
        ...base,
        startsAt: '2026-11-01T00:00',
        endsAt: '2026-11-30T23:59',
        maxUses: '50',
        minSubtotal: '100',
      }),
    ).toEqual({
      code: 'BEMVINDO10',
      type: 'percent',
      value: 10,
      minSubtotalCents: 10000,
      startsAt: new Date('2026-11-01T03:00:00.000Z'),
      endsAt: new Date('2026-12-01T02:59:00.000Z'),
      maxUses: 50,
      active: true,
    })
  })

  it('valor fixo em reais vira centavos', () => {
    expect(couponFormSchema.parse({ ...base, type: 'fixed', value: '25,50' }).value).toBe(2550)
  })

  it.each([
    [{ code: 'com espaço' }, 'code'],
    [{ value: '0' }, 'value'],
    [{ value: '101' }, 'value'],
    [{ maxUses: '0' }, 'maxUses'],
    [{ minSubtotal: '1.000,00' }, 'minSubtotal'],
    [{ minSubtotal: 'R$ 100' }, 'minSubtotal'],
    [{ startsAt: '2026-11-02T00:00', endsAt: '2026-11-01T00:00' }, 'endsAt'],
  ])('%j → erro em %s', (patch, path) => {
    const result = couponFormSchema.safeParse({ ...base, ...patch })
    expect(result.error?.issues.some((issue) => issue.path[0] === path)).toBe(true)
  })

  it('campos opcionais vazios viram null', () => {
    expect(couponFormSchema.parse(base)).toMatchObject({
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: null,
    })
  })
})

describe('couponUpdateSchema', () => {
  it('só validade, limite, mínimo e ativo', () => {
    expect(couponUpdateSchema.parse({ ...base, active: false, maxUses: '5' })).toEqual({
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: 5,
      active: false,
    })
  })
})

describe('couponToForm', () => {
  it('volta para o formulário', () => {
    expect(
      couponToForm({
        code: 'FRETE',
        type: 'fixed',
        value: 1500,
        minSubtotalCents: 20000,
        startsAt: new Date('2026-11-01T03:00:00.000Z'),
        endsAt: null,
        maxUses: null,
        active: true,
      }),
    ).toEqual({
      code: 'FRETE',
      type: 'fixed',
      value: '15,00',
      minSubtotal: '200,00',
      startsAt: '2026-11-01T00:00',
      endsAt: '',
      maxUses: '',
      active: true,
    })
  })
})
