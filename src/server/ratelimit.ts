import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'
import { serverEnv } from '@/server/env'

export type RateLimitRule = { limit: number; windowSec: number }

const limiters = new Map<string, Ratelimit>()

function limiterFor(rule: RateLimitRule): Ratelimit | null {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = serverEnv()
  // Em produção o env exige as duas variáveis; fora dela, sem Upstash não há limite.
  if (!url || !token) return null

  const key = `${rule.limit}/${rule.windowSec}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(rule.limit, `${rule.windowSec} s`),
      prefix: 'rl:streetstars',
    })
    limiters.set(key, limiter)
  }
  return limiter
}

export async function rateLimit(identifier: string, rule: RateLimitRule): Promise<boolean> {
  const limiter = limiterFor(rule)
  if (!limiter) return true
  try {
    const { success } = await limiter.limit(identifier)
    return success
  } catch (error) {
    console.error('rateLimit: falha no Redis, liberando requisição', error)
    return true
  }
}

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
