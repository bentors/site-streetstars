import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { serverEnv } from '@/server/env'
import { expirePendingOrders } from '@/server/orders/expire-orders'

const digest = (value: string) => createHash('sha256').update(value).digest()

// A Vercel Cron chama com "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET
  const given = request.headers.get('authorization') ?? ''
  if (!secret || !timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return new NextResponse('unauthorized', { status: 401 })
  }
  const expired = await expirePendingOrders()
  console.info('cron: pedidos expirados', { expired })
  return NextResponse.json({ expired })
}
