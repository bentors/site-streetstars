import 'server-only'
import { serverEnv } from '@/server/env'

export async function sendEmail(message: {
  to: string
  subject: string
  html: string
  replyTo?: string
  /** O Resend descarta envios repetidos com a mesma chave por 24 h (webhooks simultâneos). */
  idempotencyKey?: string
}): Promise<void> {
  const env = serverEnv()
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    // Desenvolvimento e preview sem Resend: o e-mail só aparece no log.
    console.info('[email não enviado: Resend não configurado]', {
      to: message.to,
      subject: message.subject,
    })
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}`)
}
