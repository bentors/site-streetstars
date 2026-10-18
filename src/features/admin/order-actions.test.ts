import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdmin = vi.hoisted(() => vi.fn())
const orders = vi.hoisted(() => ({ applyAdminTransition: vi.fn(), markOrderSeen: vi.fn() }))
const sendShippedEmail = vi.hoisted(() => vi.fn())
vi.mock('@/server/auth/session', () => ({ requireAdmin }))
vi.mock('@/server/db/orders', () => orders)
vi.mock('@/server/orders/order-emails', () => ({ sendShippedEmail }))

import {
  markOrderSeenAction,
  resendShippedEmailAction,
  transitionOrderAction,
} from './order-actions'

beforeEach(() => {
  vi.resetAllMocks()
  requireAdmin.mockResolvedValue({ uid: 'admin-uid', isAdmin: true })
  orders.applyAdminTransition.mockResolvedValue({ ok: true, data: {} })
  sendShippedEmail.mockResolvedValue(true)
})

describe('transitionOrderAction', () => {
  it('quem não é admin não chega no banco', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'))
    await expect(transitionOrderAction('o1', { to: 'delivered' })).rejects.toThrow('NOT_FOUND')
    expect(orders.applyAdminTransition).not.toHaveBeenCalled()
  })

  it('valida a entrada antes de gravar', async () => {
    const result = await transitionOrderAction('o1', { to: 'cancelled', note: '' })
    expect(result).toMatchObject({ ok: false, message: 'Descreva o motivo.' })
    expect(orders.applyAdminTransition).not.toHaveBeenCalled()
  })

  it('grava com o uid do admin', async () => {
    await transitionOrderAction('o1', { to: 'delivered' })
    expect(orders.applyAdminTransition).toHaveBeenCalledWith(
      'o1',
      { to: 'delivered' },
      'admin-uid',
      expect.any(Date),
    )
  })

  it('enviado dispara o e-mail; falha no e-mail não desfaz o status', async () => {
    sendShippedEmail.mockRejectedValue(new Error('Resend fora'))
    const result = await transitionOrderAction('o1', {
      to: 'shipped',
      trackingCode: 'AB123456789BR',
    })
    expect(result).toEqual({ ok: true, data: { emailSent: false } })
    expect(sendShippedEmail).toHaveBeenCalledWith('o1')
  })

  it('transição recusada não tenta e-mail', async () => {
    orders.applyAdminTransition.mockResolvedValue({
      ok: false,
      code: 'invalid_transition',
      message: 'x',
    })
    await transitionOrderAction('o1', { to: 'shipped', trackingCode: 'AB123456789BR' })
    expect(sendShippedEmail).not.toHaveBeenCalled()
  })
})

describe('resendShippedEmailAction', () => {
  it('falha vira mensagem', async () => {
    sendShippedEmail.mockRejectedValue(new Error('x'))
    expect(await resendShippedEmailAction('o1')).toMatchObject({ ok: false })
  })

  it('nada a enviar também avisa', async () => {
    sendShippedEmail.mockResolvedValue(false)
    expect(await resendShippedEmailAction('o1')).toMatchObject({
      ok: false,
      code: 'nothing_to_send',
    })
  })
})

describe('markOrderSeenAction', () => {
  it('exige admin', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'))
    await expect(markOrderSeenAction('o1')).rejects.toThrow()
    expect(orders.markOrderSeen).not.toHaveBeenCalled()
  })
})
