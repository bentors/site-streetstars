import { beforeEach, describe, expect, it, vi } from 'vitest'

const envMock = vi.hoisted(() => ({
  value: {} as { UPSTASH_REDIS_REST_URL?: string; UPSTASH_REDIS_REST_TOKEN?: string },
}))
const limitMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/env', () => ({ serverEnv: () => envMock.value }))
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }))
vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn(function Ratelimit() {
    return { limit: limitMock }
  }) as unknown as { slidingWindow: () => unknown }
  Ratelimit.slidingWindow = vi.fn()
  return { Ratelimit }
})

import { rateLimit } from './ratelimit'

const rule = { limit: 5, windowSec: 60 }

describe('rateLimit', () => {
  beforeEach(() => {
    limitMock.mockReset()
    envMock.value = {
      UPSTASH_REDIS_REST_URL: 'https://x.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 't',
    }
  })

  it('libera quando o Upstash não está configurado (desenvolvimento)', async () => {
    envMock.value = {}
    expect(await rateLimit('ip:1', rule)).toBe(true)
    expect(limitMock).not.toHaveBeenCalled()
  })

  it('bloqueia quando o limite estoura', async () => {
    limitMock.mockResolvedValue({ success: false })
    expect(await rateLimit('ip:1', rule)).toBe(false)
  })

  it('libera dentro do limite', async () => {
    limitMock.mockResolvedValue({ success: true })
    expect(await rateLimit('ip:1', rule)).toBe(true)
  })

  it('libera se o Redis falhar, para não derrubar vendas', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    limitMock.mockRejectedValue(new Error('redis down'))
    expect(await rateLimit('ip:1', rule)).toBe(true)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
