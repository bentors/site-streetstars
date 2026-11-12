import { describe, expect, it } from 'vitest'
import { decidePaymentOutcome, type OrderPaymentState } from './payment-outcome'

const pending: OrderPaymentState = {
  status: 'pending_payment',
  totalCents: 32480,
  payment: { paymentId: null, status: null },
  handledPaymentIds: [],
}
const paid: OrderPaymentState = {
  status: 'paid',
  totalCents: 32480,
  payment: { paymentId: '1', status: 'approved' },
  handledPaymentIds: ['1'],
}
const approved = { id: '1', status: 'approved', amountCents: 32480 }

describe('decidePaymentOutcome', () => {
  it('estorno de pedido cancelado com o mesmo pagamento → estornado', () => {
    expect(
      decidePaymentOutcome(
        { ...paid, status: 'cancelled' },
        { id: '1', status: 'refunded', amountCents: 32480 },
      ),
    ).toEqual({ kind: 'transition', to: 'refunded' })
  })

  it('aprovado com o valor certo → pago', () => {
    expect(decidePaymentOutcome(pending, approved)).toEqual({ kind: 'transition', to: 'paid' })
  })

  it('expirado ainda vira pago', () => {
    expect(decidePaymentOutcome({ ...pending, status: 'expired' }, approved)).toEqual({
      kind: 'transition',
      to: 'paid',
    })
  })

  it('evento repetido não muda nada', () => {
    expect(decidePaymentOutcome(paid, approved)).toEqual({ kind: 'ignore' })
  })

  it('aprovado com valor divergente → alerta, sem pagar', () => {
    expect(decidePaymentOutcome(pending, { ...approved, amountCents: 100 })).toEqual({
      kind: 'alert',
      reason: 'amount_mismatch',
    })
  })

  it('alerta já registrado para o mesmo pagamento não repete', () => {
    const alerted = { ...pending, handledPaymentIds: ['1'] }
    expect(decidePaymentOutcome(alerted, { ...approved, amountCents: 100 })).toEqual({
      kind: 'ignore',
    })
  })

  it('segundo pagamento aprovado num pedido pago → alerta de cobrança em dobro', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2' })).toEqual({
      kind: 'alert',
      reason: 'unexpected_payment',
    })
  })

  it('pagamento aprovado num pedido cancelado → alerta', () => {
    expect(decidePaymentOutcome({ ...pending, status: 'cancelled' }, approved)).toEqual({
      kind: 'alert',
      reason: 'unexpected_payment',
    })
  })

  it.each(['rejected', 'cancelled', 'pending', 'in_process'])(
    '%s com pedido aguardando → só registra',
    (status) => {
      expect(decidePaymentOutcome(pending, { ...approved, id: '2', status })).toEqual({
        kind: 'record',
      })
    },
  )

  it('recusado depois de aprovado não regride', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2', status: 'rejected' })).toEqual({
      kind: 'ignore',
    })
  })

  it.each(['refunded', 'charged_back'])('%s do pagamento do pedido → estornado', (status) => {
    expect(decidePaymentOutcome(paid, { ...approved, status })).toEqual({
      kind: 'transition',
      to: 'refunded',
    })
    expect(decidePaymentOutcome({ ...paid, status: 'shipped' }, { ...approved, status })).toEqual({
      kind: 'transition',
      to: 'refunded',
    })
  })

  it('estorno de outro pagamento (o duplicado) não estorna o pedido', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2', status: 'refunded' })).toEqual({
      kind: 'ignore',
    })
  })
})
