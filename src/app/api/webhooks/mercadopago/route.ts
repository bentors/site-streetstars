import { NextResponse } from 'next/server'
import { serverEnv } from '@/server/env'
import { verifyMercadoPagoSignature } from '@/server/integrations/mercadopago-signature'
import { handlePaymentNotification } from '@/server/orders/payment-notification'

type Body = { type?: unknown; data?: { id?: unknown } } | null

export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = (await request.json().catch(() => null)) as Body
  const queryId = url.searchParams.get('data.id')

  const secret = serverEnv().MERCADOPAGO_WEBHOOK_SECRET
  const valid =
    !!secret &&
    verifyMercadoPagoSignature({
      signature: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId: queryId,
      secret,
    })
  if (!valid) {
    console.warn('webhook MP: assinatura inválida')
    return new NextResponse('unauthorized', { status: 401 })
  }

  const type = url.searchParams.get('type') ?? body?.type
  const bodyId = body?.data?.id
  const paymentId =
    queryId ?? (typeof bodyId === 'string' || typeof bodyId === 'number' ? String(bodyId) : null)
  if (type !== 'payment' || !paymentId) return new NextResponse('ignored')

  try {
    await handlePaymentNotification(paymentId)
    return new NextResponse('ok')
  } catch (error) {
    console.error('webhook MP: erro ao processar', { paymentId, error })
    return new NextResponse('error', { status: 500 })
  }
}
