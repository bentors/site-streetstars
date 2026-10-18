import { describe, expect, it } from 'vitest'
import { isPaidStatus, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'
import { canTransition } from './order-status'

const ALLOWED: [OrderStatus, OrderStatus][] = [
  ['pending_payment', 'paid'],
  ['pending_payment', 'expired'],
  ['pending_payment', 'cancelled'],
  ['expired', 'paid'],
  ['paid', 'in_production'],
  ['paid', 'cancelled'],
  ['paid', 'refunded'],
  ['in_production', 'shipped'],
  ['in_production', 'refunded'],
  ['shipped', 'delivered'],
  ['shipped', 'refunded'],
  ['delivered', 'refunded'],
  ['cancelled', 'refunded'],
]

describe('canTransition', () => {
  it('aceita só as transições da tabela da spec', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const expected = ALLOWED.some(([f, t]) => f === from && t === to)
        expect(canTransition(from, to), `${from} → ${to}`).toBe(expected)
      }
    }
  })

  it('estornado é final; cancelado só vai para estornado (estorno feito no painel do MP)', () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition('cancelled', to)).toBe(to === 'refunded')
      expect(canTransition('refunded', to)).toBe(false)
    }
  })
})

describe('isPaidStatus', () => {
  it('pago e posteriores contam como pagos', () => {
    expect(ORDER_STATUSES.filter(isPaidStatus)).toEqual([
      'paid',
      'in_production',
      'shipped',
      'delivered',
    ])
  })
})
