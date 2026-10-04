'use server'

import { fail, ok, type Result } from '@/lib/result'
import { getOrderByToken, isPayable } from '@/server/orders/access'
import { paymentRedirectUrl } from '@/server/orders/payment'
import { clientIp, rateLimit } from '@/server/ratelimit'

export async function retryPaymentAction(token: string): Promise<Result<{ redirectUrl: string }>> {
  if (!(await rateLimit(`retry-payment:${await clientIp()}`, { limit: 10, windowSec: 60 }))) {
    return fail('rate_limited', 'Muitas tentativas. Aguarde um instante e tente de novo.')
  }
  const order = await getOrderByToken(String(token))
  if (!order) return fail('not_found', 'Pedido não encontrado.')
  if (!isPayable(order)) return fail('not_payable', 'Este pedido não pode mais ser pago.')
  try {
    return ok({ redirectUrl: await paymentRedirectUrl(order) })
  } catch (error) {
    console.error('retryPayment: falha ao criar a preferência', { orderId: order.id, error })
    return fail('payment_unavailable', 'Não foi possível abrir o pagamento agora. Tente de novo.')
  }
}
