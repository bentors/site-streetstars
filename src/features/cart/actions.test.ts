import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimit = vi.hoisted(() => vi.fn())
const getProductsByIds = vi.hoisted(() => vi.fn())
vi.mock('@/server/ratelimit', () => ({ rateLimit, clientIp: async () => '1.2.3.4' }))
vi.mock('@/server/db/products', () => ({ getProductsByIds }))

import { priceCartAction } from './actions'

beforeEach(() => {
  vi.resetAllMocks()
  getProductsByIds.mockResolvedValue([])
})

describe('priceCartAction', () => {
  it('aplica o limite de requisições antes de processar a entrada', async () => {
    rateLimit.mockResolvedValue(false)
    await expect(priceCartAction('não é array')).rejects.toThrow('Muitas requisições')
    expect(getProductsByIds).not.toHaveBeenCalled()
  })
})
