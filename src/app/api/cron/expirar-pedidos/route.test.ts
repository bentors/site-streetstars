import { beforeEach, describe, expect, it, vi } from 'vitest'

const expirePendingOrders = vi.hoisted(() => vi.fn())
const env = vi.hoisted(() => ({
  value: { CRON_SECRET: 'segredo-do-cron-123' } as Record<string, string | undefined>,
}))
vi.mock('@/server/orders/expire-orders', () => ({ expirePendingOrders }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { GET } from './route'

const call = (authorization?: string) =>
  GET(
    new Request('https://loja.test/api/cron/expirar-pedidos', {
      headers: authorization ? { authorization } : {},
    }),
  )

beforeEach(() => {
  expirePendingOrders.mockReset()
  env.value = { CRON_SECRET: 'segredo-do-cron-123' }
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('GET /api/cron/expirar-pedidos', () => {
  it('sem o segredo certo → 401', async () => {
    expect((await call()).status).toBe(401)
    expect((await call('Bearer errado')).status).toBe(401)
    env.value = {}
    expect((await call('Bearer undefined')).status).toBe(401)
    expect(expirePendingOrders).not.toHaveBeenCalled()
  })

  it('com o segredo → expira e responde a contagem', async () => {
    expirePendingOrders.mockResolvedValue(3)
    const response = await call('Bearer segredo-do-cron-123')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ expired: 3 })
  })
})
