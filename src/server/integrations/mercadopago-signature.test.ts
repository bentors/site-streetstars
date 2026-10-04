import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyMercadoPagoSignature } from './mercadopago-signature'

const secret = 'segredo'
const sign = (manifest: string, key = secret) =>
  createHmac('sha256', key).update(manifest).digest('hex')
const header = (manifest: string, key = secret) => `ts=1700000000,v1=${sign(manifest, key)}`
const MANIFEST = 'id:123456;request-id:req-1;ts:1700000000;'
const valid = { signature: header(MANIFEST), requestId: 'req-1', dataId: '123456', secret }

describe('verifyMercadoPagoSignature', () => {
  it('aceita a assinatura do Mercado Pago', () => {
    expect(verifyMercadoPagoSignature(valid)).toBe(true)
  })

  it('id alfanumérico entra em minúsculas no manifesto', () => {
    const signature = header('id:abc123;request-id:req-1;ts:1700000000;')
    expect(verifyMercadoPagoSignature({ ...valid, signature, dataId: 'ABC123' })).toBe(true)
  })

  it('sem request-id, a parte sai do manifesto', () => {
    const signature = header('id:123456;ts:1700000000;')
    expect(verifyMercadoPagoSignature({ ...valid, signature, requestId: null })).toBe(true)
  })

  it.each([
    ['segredo errado', { ...valid, secret: 'outro' }],
    ['id trocado', { ...valid, dataId: '999' }],
    ['request-id trocado', { ...valid, requestId: 'req-2' }],
    ['sem cabeçalho', { ...valid, signature: null }],
    ['sem ts', { ...valid, signature: `v1=${sign(MANIFEST)}` }],
    ['v1 com outro tamanho', { ...valid, signature: 'ts=1700000000,v1=abc' }],
  ])('recusa: %s', (_, input) => {
    expect(verifyMercadoPagoSignature(input)).toBe(false)
  })
})
