import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { sendEmail } from './resend'

const fetchMock = vi.fn()
const message = { to: 'ana@exemplo.com', subject: 'Oi', html: '<p>oi</p>' }

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('sendEmail', () => {
  it('sem Resend configurado (desenvolvimento), só registra no log', async () => {
    env.value = { NODE_ENV: 'development' }
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await sendEmail(message)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalled()
  })

  it('envia pela API do Resend', async () => {
    env.value = { RESEND_API_KEY: 're_1', EMAIL_FROM: 'Street Stars <pedidos@loja.test>' }
    fetchMock.mockResolvedValue(new Response('{"id":"e1"}'))
    await sendEmail({ ...message, replyTo: 'loja@loja.test' })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_1' })
    expect(JSON.parse(init.body)).toEqual({
      from: 'Street Stars <pedidos@loja.test>',
      to: ['ana@exemplo.com'],
      subject: 'Oi',
      html: '<p>oi</p>',
      reply_to: 'loja@loja.test',
    })
  })

  it('repassa a chave de idempotência para o Resend não enviar duas vezes', async () => {
    env.value = { RESEND_API_KEY: 're_1', EMAIL_FROM: 'x@loja.test' }
    fetchMock.mockResolvedValue(new Response('{"id":"e1"}'))
    await sendEmail({ ...message, idempotencyKey: 'order-confirmation/o1' })
    expect(fetchMock.mock.calls[0]?.[1].headers).toMatchObject({
      'Idempotency-Key': 'order-confirmation/o1',
    })
  })

  it('erro do Resend lança (o webhook responde 500 e o MP reenvia)', async () => {
    env.value = { RESEND_API_KEY: 're_1', EMAIL_FROM: 'x@loja.test' }
    fetchMock.mockResolvedValue(new Response('quota', { status: 429 }))
    await expect(sendEmail(message)).rejects.toThrow('429')
  })
})
